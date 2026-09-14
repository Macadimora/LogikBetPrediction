import { prisma } from "@/lib/prisma";

const API_BASE_URL =
  "https://v3.football.api-sports.io";

const APP_TIME_ZONE = "Africa/Lagos";
const MAX_DAILY_MATCHES = 20;

const TOP_COMPETITION_IDS = new Set([
  2, // UEFA Champions League
  3, // UEFA Europa League
  39, // Premier League
  61, // Ligue 1
  78, // Bundesliga
  135, // Serie A
  140, // La Liga
  848, // UEFA Conference League
]);

type ApiFootballResponse<T> = {
  errors?: Record<string, string> | string[];
  results?: number;
  response?: T[];
};

type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long?: string;
    };
  };
  league: {
    id: number;
    name: string;
  };
  teams: {
    home: {
      name: string;
    };
    away: {
      name: string;
    };
  };
};

type ApiPrediction = {
  predictions?: {
    advice?: string | null;
    percent?: {
      home?: string | null;
      draw?: string | null;
      away?: string | null;
    };
  };
};

type PredictedScore = {
  home: number;
  away: number;
};

function getPlatformDate(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year =
    parts.find((part) => part.type === "year")?.value;

  const month =
    parts.find((part) => part.type === "month")?.value;

  const day =
    parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error(
      "Could not determine the current platform date."
    );
  }

  return `${year}-${month}-${day}`;
}

function parseProbability(
  value: string | null | undefined
): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(
    value.replace("%", "").trim()
  );

  if (!Number.isFinite(parsed)) {
    return null;
  }

  const probability =
    parsed > 1 ? parsed / 100 : parsed;

  if (probability < 0 || probability > 1) {
    return null;
  }

  return probability;
}

function derivePredictedScore(
  pHome: number,
  pDraw: number,
  pAway: number
): PredictedScore {
  const strongest = Math.max(
    pHome,
    pDraw,
    pAway
  );

  if (strongest === pDraw) {
    return pDraw >= 0.4
      ? { home: 1, away: 1 }
      : { home: 0, away: 0 };
  }

  if (strongest === pHome) {
    if (pHome >= 0.65) {
      return { home: 2, away: 0 };
    }

    if (pHome >= 0.5) {
      return { home: 2, away: 1 };
    }

    return { home: 1, away: 0 };
  }

  if (pAway >= 0.65) {
    return { home: 0, away: 2 };
  }

  if (pAway >= 0.5) {
    return { home: 1, away: 2 };
  }

  return { home: 0, away: 1 };
}

function hasApiErrors(
  errors: ApiFootballResponse<unknown>["errors"]
): boolean {
  if (Array.isArray(errors)) {
    return errors.length > 0;
  }

  return Boolean(
    errors && Object.keys(errors).length > 0
  );
}

async function apiFootballRequest<T>(
  path: string
): Promise<T[]> {
  const apiKey =
    process.env.API_FOOTBALL_API_KEY;

  if (!apiKey) {
    throw new Error(
      "API_FOOTBALL_API_KEY is not configured."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      headers: {
        "x-apisports-key": apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const payload =
    (await response.json()) as ApiFootballResponse<T>;

  if (!response.ok) {
    throw new Error(
      `API-Football request failed with status ${response.status}.`
    );
  }

  if (hasApiErrors(payload.errors)) {
    throw new Error(
      `API-Football error: ${JSON.stringify(
        payload.errors
      )}`
    );
  }

  return Array.isArray(payload.response)
    ? payload.response
    : [];
}

export async function syncApiFootballPredictions() {
  const now = new Date();
  const platformDate = getPlatformDate();

  const threeDaysAgo = new Date(
    now.getTime() - 3 * 24 * 60 * 60 * 1000
  );

  const deletedOldFixtures =
    await prisma.fixture.deleteMany({
      where: {
        kickoffTime: {
          lt: threeDaysAgo,
        },
      },
    });

  const fixtures = await apiFootballRequest<ApiFixture>(
    `/fixtures?date=${platformDate}&timezone=${encodeURIComponent(
      APP_TIME_ZONE
    )}`
  );

  const selectedFixtures = fixtures
    .filter((item) =>
      TOP_COMPETITION_IDS.has(item.league.id)
    )
    .filter((item) => {
      const kickoffTime = new Date(
        item.fixture.date
      );

      return (
        !Number.isNaN(kickoffTime.getTime()) &&
        kickoffTime.getTime() > now.getTime() &&
        ["NS", "TBD"].includes(
          item.fixture.status.short
        )
      );
    })
    .sort(
      (a, b) =>
        new Date(a.fixture.date).getTime() -
        new Date(b.fixture.date).getTime()
    )
    .slice(0, MAX_DAILY_MATCHES);

  let fixturesCreated = 0;
  let fixturesUpdated = 0;

  let predictionsCreated = 0;
  let predictionsUpdated = 0;
  let predictionsAutoPublished = 0;
  let predictionsSkipped = 0;
  let predictionsProtected = 0;
  let missingProbabilities = 0;
  let emptyPredictionResponses = 0;

  for (const item of selectedFixtures) {
    const predictionResponse =
      await apiFootballRequest<ApiPrediction>(
        `/predictions?fixture=${item.fixture.id}`
      );

    const apiPrediction =
      predictionResponse[0];

    if (!apiPrediction) {
      emptyPredictionResponses++;
      predictionsSkipped++;
      continue;
    }

    const pHome = parseProbability(
      apiPrediction.predictions?.percent?.home
    );

    const pDraw = parseProbability(
      apiPrediction.predictions?.percent?.draw
    );

    const pAway = parseProbability(
      apiPrediction.predictions?.percent?.away
    );

    if (
      pHome == null ||
      pDraw == null ||
      pAway == null
    ) {
      missingProbabilities++;
      predictionsSkipped++;
      continue;
    }

    const kickoffTime = new Date(
      item.fixture.date
    );

    const existingFixture =
      await prisma.fixture.findUnique({
        where: {
          externalId: item.fixture.id,
        },
        select: {
          id: true,
        },
      });

    const fixture =
      await prisma.fixture.upsert({
        where: {
          externalId: item.fixture.id,
        },
        update: {
          kickoffTime,
          leagueId: item.league.id,
          leagueName: item.league.name,
          homeTeam: item.teams.home.name,
          awayTeam: item.teams.away.name,
          status: item.fixture.status.short,
        },
        create: {
          externalId: item.fixture.id,
          kickoffTime,
          leagueId: item.league.id,
          leagueName: item.league.name,
          homeTeam: item.teams.home.name,
          awayTeam: item.teams.away.name,
          status: item.fixture.status.short,
        },
      });

    if (existingFixture) {
      fixturesUpdated++;
    } else {
      fixturesCreated++;
    }

    const existingPredictions =
      await prisma.prediction.findMany({
        where: {
          fixtureId: fixture.id,
        },
        select: {
          id: true,
          source: true,
          status: true,
          manualOverride: true,
        },
      });

    const protectedPrediction =
      existingPredictions.find(
        (prediction) =>
          prediction.manualOverride ||
          prediction.source === "ADMIN"
      );

    if (protectedPrediction) {
      predictionsProtected++;
      predictionsSkipped++;
      continue;
    }

    const existingPrediction =
      existingPredictions.find(
        (prediction) =>
          prediction.source === "API_FOOTBALL" ||
          prediction.source === "PLAYER_ELO"
      );

    const predictedScore =
      derivePredictedScore(
        pHome,
        pDraw,
        pAway
      );

    const confidence = Math.max(
      pHome,
      pDraw,
      pAway
    );

    const analysis =
      apiPrediction.predictions?.advice?.trim() ||
      null;

    if (existingPrediction) {
      const shouldAutoPublish =
        existingPrediction.status === "DRAFT";

      await prisma.prediction.update({
        where: {
          id: existingPrediction.id,
        },
        data: {
          source: "API_FOOTBALL",
          pHome,
          pDraw,
          pAway,
          predictedHomeScore:
            predictedScore.home,
          predictedAwayScore:
            predictedScore.away,
          confidence,
          analysis,
          ...(shouldAutoPublish
            ? {
                status: "PUBLISHED" as const,
                publishedAt: now,
                scheduledFor: null,
              }
            : {}),
        },
      });

      predictionsUpdated++;

      if (shouldAutoPublish) {
        predictionsAutoPublished++;
      }

      continue;
    }

    await prisma.prediction.create({
      data: {
        fixtureId: fixture.id,
        access: "FREE",
        source: "API_FOOTBALL",
        status: "PUBLISHED",
        pHome,
        pDraw,
        pAway,
        predictedHomeScore:
          predictedScore.home,
        predictedAwayScore:
          predictedScore.away,
        confidence,
        analysis,
        publishedAt: now,
        scheduledFor: null,
      },
    });

    predictionsCreated++;
    predictionsAutoPublished++;
  }

  const result = {
    provider: "API_FOOTBALL",
    platformDate,
    requestsUsed:
      1 + selectedFixtures.length,

    receivedFixtures: fixtures.length,
    eligibleTopCompetitionFixtures:
      selectedFixtures.length,

    deletedOldFixtures:
      deletedOldFixtures.count,

    fixturesCreated,
    fixturesUpdated,

    predictionsCreated,
    predictionsUpdated,
    predictionsAutoPublished,
    predictionsSkipped,
    predictionsProtected,

    diagnostics: {
      missingProbabilities,
      emptyPredictionResponses,
      maximumDailyMatches:
        MAX_DAILY_MATCHES,
      selectedCompetitionIds:
        Array.from(TOP_COMPETITION_IDS),
    },
  };

  console.log(
    "API-Football sync result:",
    result
  );

  return result;
}
