export type ProductPlan = "FREE" | "PRO" | "TEAM" | "REVIEW_ADDON";

export const PRODUCT_PLANS: readonly ProductPlan[] = ["FREE", "PRO", "TEAM", "REVIEW_ADDON"];

/** Free is always present; higher plans are additive and can be granted manually. */
export function effectivePlans(granted: readonly string[] = []): ProductPlan[] {
  const allowed = new Set(granted.filter((plan): plan is ProductPlan => PRODUCT_PLANS.includes(plan as ProductPlan)));
  allowed.add("FREE");
  return PRODUCT_PLANS.filter((plan) => allowed.has(plan));
}

/** Review means a separate human service; self-study is always free. */
export function canUseFeature(feature: "diagnostic" | "first_pass" | "projects" | "interview" | "review", plans: readonly ProductPlan[]): boolean {
  if (feature === "review") return plans.includes("REVIEW_ADDON") || plans.includes("PRO");
  return true;
}
