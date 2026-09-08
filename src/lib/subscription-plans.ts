export const SUBSCRIPTION_PLANS = {
  WEEKLY: {
    name: "Weekly VIP",
    description: "7 days of access to all VIP football predictions.",
    durationDays: 7,
    amount: 300000,
    displayAmount: "₦3,000",
  },

  MONTHLY: {
    name: "Monthly VIP",
    description: "30 days of access to all VIP football predictions.",
    durationDays: 30,
    amount: 1000000,
    displayAmount: "₦10,000",
  },
} as const;

export type SubscriptionPlanKey =
  keyof typeof SUBSCRIPTION_PLANS;
