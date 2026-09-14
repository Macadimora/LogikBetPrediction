import { prisma } from "@/lib/prisma";

type PlayerEloPrediction = {
  fixture_id: number;
  kickoff_time: string;

  league_id?: number | null;
  league_name?: string | null;

  home_team?: string | null;
  away_team?: string | null;

  home_team_name?: string | null;
  away_team_name?: string | null;

  home_team_elo?: number | null;
  away_team_elo?: number | null;

  p_home?: number | null;
  p_draw?: number | null;
  p_away?: number | null;

  predicted_home_score?: number | null;
  predicted_away_score?: number | null;

  confidence?: number | null;

  status?: string | null;
};

type PlayerEloResponse =
  | PlayerEloPrediction[]
  | {
      data?: PlayerEloPrediction[];
      predictions?: PlayerEloPrediction[];
    };

    type PredictedScore = {
  home: number;
  away: number;
};

/**
 * Generates a conservative exact-score prediction when
 * PlayerElo does not provide one.
 *
 * This uses the Home/Draw/Away probabilities to choose
 * a plausible football score while keeping the result
 * consistent with the model's strongest outcome.
 */
function derivePredictedScore(
  pHome: number,
  pDraw: number,
  pAway: number
): PredictedScore {
  const probabilities = [pHome, pDraw, pAway];
  const strongest = Math.max(...probabilities);

  if (strongest === pDraw) {
    if (pDraw >= 0.4) {
      return { home: 1, away: 1 };
    }

    return { home: 0, away: 0 };
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

export async function syncPlayerEloPredictions() {
  const apiKey = process.env.PLAYER_ELO_API_KEY;

  if (!apiKey) {
    throw new Error(
      "PLAYER_ELO_API_KEY is not configured."
    );
  }

  const response = await fetch(
    "https://data-api.playerelo.football/v1/predictions?limit=200",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },

      cache: "no-store",
    }
  );

  if (!response.ok) {
    const responseText =
      await response.text();

    console.error(
      "PlayerElo API error:",
      response.status,
      responseText
    );

    throw new Error(
      `PlayerElo API request failed with status ${response.status}.`
    );
  }

  const payload =
    (await response.json()) as PlayerEloResponse;

  let predictions: PlayerEloPrediction[] = [];

  if (Array.isArray(payload)) {
    predictions = payload;
  } else if (
    Array.isArray(payload.predictions)
  ) {
    predictions = payload.predictions;
  } else if (
    Array.isArray(payload.data)
  ) {
    predictions = payload.data;
  }

  const now = new Date();

  /*
   * -----------------------------------------
   * DATABASE CLEANUP
   * -----------------------------------------
   *
   * Keep fixtures from the last 3 days plus
   * all future fixtures.
   *
   * Fixture -> Prediction uses Cascade.
   * Prediction -> PredictionView also uses
   * Cascade.
   *
   * Therefore deleting the fixture also
   * removes its associated prediction data.
   */

  const threeDaysAgo = new Date(
    now.getTime() -
      3 * 24 * 60 * 60 * 1000
  );

  const deletedOldFixtures =
    await prisma.fixture.deleteMany({
      where: {
        kickoffTime: {
          lt: threeDaysAgo,
        },
      },
    });

  console.log(
    `Deleted ${deletedOldFixtures.count} fixtures older than 3 days.`
  );

  /*
   * -----------------------------------------
   * SYNC COUNTERS
   * -----------------------------------------
   */

  let fixturesCreated = 0;
  let fixturesUpdated = 0;

  let predictionsCreated = 0;
  let predictionsUpdated = 0;
  let predictionsAutoPublished = 0;
  let predictionsSkipped = 0;

  let pastPredictionsReceived = 0;
  let futurePredictionsReceived = 0;
  let invalidKickoffDates = 0;
  let historicalPredictionsSkipped = 0;

  let missingProbabilities = 0;
  let missingFixtureId = 0;
  let missingKickoffTime = 0;

  const validKickoffTimes: Date[] = [];

  /*
   * -----------------------------------------
   * PROCESS PLAYERELO PREDICTIONS
   * -----------------------------------------
   */

  for (const item of predictions) {
    /*
     * All three probabilities must exist
     * before a prediction is useful.
     */

    const hasProbabilities =
      item.p_home != null &&
      item.p_draw != null &&
      item.p_away != null;

    if (!hasProbabilities) {
      missingProbabilities++;
      predictionsSkipped++;
      continue;
    }

    /*
     * Fixture ID and kickoff time are
     * required.
     */

    if (!item.fixture_id) {
      missingFixtureId++;
      predictionsSkipped++;
      continue;
    }

    if (!item.kickoff_time) {
      missingKickoffTime++;
      predictionsSkipped++;
      continue;
    }

    const kickoffTime = new Date(
      item.kickoff_time
    );

    if (
      Number.isNaN(
        kickoffTime.getTime()
      )
    ) {
      predictionsSkipped++;
      invalidKickoffDates++;
      continue;
    }

    validKickoffTimes.push(
      kickoffTime
    );

    /*
     * -----------------------------------------
     * HISTORICAL PROTECTION
     * -----------------------------------------
     *
     * PlayerElo occasionally returns stale
     * matches.
     *
     * Never create or update a prediction
     * whose match has already kicked off.
     */

    if (
      kickoffTime.getTime() <
      now.getTime()
    ) {
      pastPredictionsReceived++;
      historicalPredictionsSkipped++;
      predictionsSkipped++;
      continue;
    }

    futurePredictionsReceived++;

    /*
     * -----------------------------------------
     * TEAM INFORMATION
     * -----------------------------------------
     */

    const homeTeam =
      item.home_team_name ||
      item.home_team ||
      "Unknown Home Team";

    const awayTeam =
      item.away_team_name ||
      item.away_team ||
      "Unknown Away Team";

    /*
     * -----------------------------------------
     * FIXTURE
     * -----------------------------------------
     */

    const existingFixture =
      await prisma.fixture.findUnique({
        where: {
          externalId:
            item.fixture_id,
        },

        select: {
          id: true,
        },
      });

    const fixture =
      await prisma.fixture.upsert({
        where: {
          externalId:
            item.fixture_id,
        },

        update: {
          kickoffTime,

          leagueId:
            item.league_id ??
            null,

          leagueName:
            item.league_name ||
            "Unknown League",

          homeTeam,
          awayTeam,

          homeTeamElo:
            item.home_team_elo ??
            null,

          awayTeamElo:
            item.away_team_elo ??
            null,

          status:
            item.status ||
            "scheduled",
        },

        create: {
          externalId:
            item.fixture_id,

          kickoffTime,

          leagueId:
            item.league_id ??
            null,

          leagueName:
            item.league_name ||
            "Unknown League",

          homeTeam,
          awayTeam,

          homeTeamElo:
            item.home_team_elo ??
            null,

          awayTeamElo:
            item.away_team_elo ??
            null,

          status:
            item.status ||
            "scheduled",
        },
      });

    if (existingFixture) {
      fixturesUpdated++;
    } else {
      fixturesCreated++;
    }

    /*
     * -----------------------------------------
     * PREDICTED CORRECT SCORE
     * -----------------------------------------
     *
     * Prefer a correct-score prediction supplied
     * directly by PlayerElo. If PlayerElo does
     * not provide both scores, generate a
     * fallback from the Home/Draw/Away
     * probabilities.
     */
    const fallbackScore = derivePredictedScore(
      item.p_home!,
      item.p_draw!,
      item.p_away!
    );

    const hasPlayerEloScore =
      item.predicted_home_score != null &&
      item.predicted_away_score != null;

    const predictedHomeScore =
      hasPlayerEloScore
        ? item.predicted_home_score!
        : fallbackScore.home;

    const predictedAwayScore =
      hasPlayerEloScore
        ? item.predicted_away_score!
        : fallbackScore.away;

    /*
     * -----------------------------------------
     * EXISTING PREDICTION
     * -----------------------------------------
     */

    const existingPrediction =
      await prisma.prediction.findFirst({
        where: {
          fixtureId:
            fixture.id,

          source:
            "PLAYER_ELO",
        },

        select: {
          id: true,
          status: true,
          manualOverride: true,
        },
      });

    if (existingPrediction) {
      /*
       * -----------------------------------------
       * MANUAL OVERRIDE PROTECTION
       * -----------------------------------------
       *
       * AI-managed predictions continue to receive
       * fresh PlayerElo probabilities, confidence
       * and predicted-score data on every sync.
       *
       * Once an admin manually edits prediction
       * content, manualOverride becomes true. In
       * that case the fixture can still be refreshed
       * above, but the admin's prediction values are
       * preserved and PlayerElo cannot overwrite them.
       *
       * A manually overridden DRAFT is also preserved
       * as DRAFT so an intentional admin status change
       * is not automatically undone.
       */

      if (existingPrediction.manualOverride) {
        predictionsUpdated++;
        continue;
      }

      const shouldAutoPublish =
        existingPrediction.status ===
        "DRAFT";

      await prisma.prediction.update({
        where: {
          id: existingPrediction.id,
        },

        data: {
          pHome:
            item.p_home,

          pDraw:
            item.p_draw,

          pAway:
            item.p_away,

          predictedHomeScore,

          predictedAwayScore,

          confidence:
            item.confidence ??
            null,

          ...(shouldAutoPublish
            ? {
                status:
                  "PUBLISHED" as const,

                publishedAt:
                  now,

                scheduledFor:
                  null,
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

    /*
     * -----------------------------------------
     * NEW PREDICTION
     * -----------------------------------------
     *
     * New valid future PlayerElo predictions
     * are published immediately.
     *
     * access remains FREE for backwards
     * compatibility with the current schema.
     *
     * VIP now controls how much information
     * the user sees rather than whether the
     * match itself is visible.
     */

    await prisma.prediction.create({
      data: {
        fixtureId:
          fixture.id,

        access:
          "FREE",

        source:
          "PLAYER_ELO",

        status:
          "PUBLISHED",

        pHome:
          item.p_home,

        pDraw:
          item.p_draw,

        pAway:
          item.p_away,

        predictedHomeScore,

        predictedAwayScore,

        confidence:
          item.confidence ??
          null,

        publishedAt:
          now,

        scheduledFor:
          null,
      },
    });

    predictionsCreated++;
    predictionsAutoPublished++;
  }

  /*
   * -----------------------------------------
   * DIAGNOSTICS
   * -----------------------------------------
   */

  const sortedKickoffs =
    validKickoffTimes.sort(
      (a, b) =>
        a.getTime() -
        b.getTime()
    );

  const earliestKickoff =
    sortedKickoffs.length > 0
      ? sortedKickoffs[
          0
        ].toISOString()
      : null;

  const latestKickoff =
    sortedKickoffs.length > 0
      ? sortedKickoffs[
          sortedKickoffs.length - 1
        ].toISOString()
      : null;

  const result = {
    received:
      predictions.length,

    deletedOldFixtures:
      deletedOldFixtures.count,

    fixturesCreated,
    fixturesUpdated,

    predictionsCreated,
    predictionsUpdated,
    predictionsAutoPublished,
    predictionsSkipped,

    diagnostics: {
      syncTime:
        now.toISOString(),

      cleanupCutoff:
        threeDaysAgo.toISOString(),

      earliestKickoff,
      latestKickoff,

      pastPredictionsReceived,
      futurePredictionsReceived,

      historicalPredictionsSkipped,
      invalidKickoffDates,

      missingProbabilities,
      missingFixtureId,
      missingKickoffTime,
    },
  };

  console.log(
    "PlayerElo sync result:",
    result
  );

  return result;
}
