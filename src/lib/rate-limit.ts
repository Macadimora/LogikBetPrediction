import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const FORGOT_PASSWORD_LIMIT = 3;
const REGISTER_LIMIT = 5;
const LOGIN_LIMIT = 10;
const RESEND_VERIFICATION_LIMIT = 3;

const hasUpstashConfig =
  Boolean(
    process.env.UPSTASH_REDIS_REST_URL
  ) &&
  Boolean(
    process.env.UPSTASH_REDIS_REST_TOKEN
  );

const redis =
  hasUpstashConfig
    ? Redis.fromEnv()
    : null;

const forgotPasswordLimiter =
  redis
    ? new Ratelimit({
        redis,
        limiter:
          Ratelimit.slidingWindow(
            FORGOT_PASSWORD_LIMIT,
            "15 m"
          ),
        analytics: true,
        prefix:
          "logikbet:forgot-password",
      })
    : null;

const registerLimiter =
  redis
    ? new Ratelimit({
        redis,
        limiter:
          Ratelimit.slidingWindow(
            REGISTER_LIMIT,
            "15 m"
          ),
        analytics: true,
        prefix:
          "logikbet:register",
      })
    : null;

const loginLimiter =
  redis
    ? new Ratelimit({
        redis,
        limiter:
          Ratelimit.slidingWindow(
            LOGIN_LIMIT,
            "15 m"
          ),
        analytics: true,
        prefix:
          "logikbet:login",
      })
    : null;

const resendVerificationLimiter =
  redis
    ? new Ratelimit({
        redis,
        limiter:
          Ratelimit.slidingWindow(
            RESEND_VERIFICATION_LIMIT,
            "15 m"
          ),
        analytics: true,
        prefix:
          "logikbet:resend-verification",
      })
    : null;

const localRateLimitStore =
  new Map<
    string,
    {
      count: number;
      resetAt: number;
    }
  >();

const LOCAL_WINDOW_MS =
  15 * 60 * 1000;

function localRateLimit(
  identifier: string,
  limit: number
): RateLimitResult {
  const now = Date.now();

  const existing =
    localRateLimitStore.get(
      identifier
    );

  if (
    !existing ||
    existing.resetAt <= now
  ) {
    const resetAt =
      now + LOCAL_WINDOW_MS;

    localRateLimitStore.set(
      identifier,
      {
        count: 1,
        resetAt,
      }
    );

    return {
      success: true,
      limit,
      remaining:
        Math.max(
          0,
          limit - 1
        ),
      reset: resetAt,
    };
  }

  if (
    existing.count >= limit
  ) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset:
        existing.resetAt,
    };
  }

  existing.count += 1;

  localRateLimitStore.set(
    identifier,
    existing
  );

  return {
    success: true,
    limit,
    remaining:
      Math.max(
        0,
        limit -
          existing.count
      ),
    reset:
      existing.resetAt,
  };
}

function clearLocalRateLimit(
  identifier: string
) {
  localRateLimitStore.delete(
    identifier
  );
}

export async function rateLimitForgotPassword(
  identifier: string
): Promise<RateLimitResult> {
  if (
    !forgotPasswordLimiter
  ) {
    return localRateLimit(
      `forgot-password:${identifier}`,
      FORGOT_PASSWORD_LIMIT
    );
  }

  const result =
    await forgotPasswordLimiter.limit(
      identifier
    );

  return {
    success:
      result.success,
    limit:
      result.limit,
    remaining:
      result.remaining,
    reset:
      result.reset,
  };
}

export async function rateLimitRegistration(
  identifier: string
): Promise<RateLimitResult> {
  if (!registerLimiter) {
    return localRateLimit(
      `register:${identifier}`,
      REGISTER_LIMIT
    );
  }

  const result =
    await registerLimiter.limit(
      identifier
    );

  return {
    success:
      result.success,
    limit:
      result.limit,
    remaining:
      result.remaining,
    reset:
      result.reset,
  };
}

export async function rateLimitLogin(
  identifier: string
): Promise<RateLimitResult> {
  if (!loginLimiter) {
    return localRateLimit(
      `login:${identifier}`,
      LOGIN_LIMIT
    );
  }

  const result =
    await loginLimiter.limit(
      identifier
    );

  return {
    success:
      result.success,
    limit:
      result.limit,
    remaining:
      result.remaining,
    reset:
      result.reset,
  };
}

export async function rateLimitResendVerification(
  identifier: string
): Promise<RateLimitResult> {
  if (
    !resendVerificationLimiter
  ) {
    return localRateLimit(
      `resend-verification:${identifier}`,
      RESEND_VERIFICATION_LIMIT
    );
  }

  const result =
    await resendVerificationLimiter.limit(
      identifier
    );

  return {
    success:
      result.success,
    limit:
      result.limit,
    remaining:
      result.remaining,
    reset:
      result.reset,
  };
}

export async function resetLoginRateLimit(
  identifier: string
): Promise<void> {
  if (!loginLimiter) {
    clearLocalRateLimit(
      `login:${identifier}`
    );

    return;
  }

  await loginLimiter.resetUsedTokens(
    identifier
  );
}