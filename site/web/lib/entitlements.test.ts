import { describe, expect, it } from "vitest";
import { canUseFeature, effectivePlans } from "./entitlements";

describe("product entitlements", () => {
  it("always preserves free access and ignores unknown grants", () => {
    expect(effectivePlans(["PRO", "UNKNOWN"])).toEqual(["FREE", "PRO"]);
  });

  it.each(["diagnostic", "first_pass", "projects", "interview"] as const)(
    "keeps %s free with or without an account plan",
    (feature) => {
      expect(canUseFeature(feature, [])).toBe(true);
      expect(canUseFeature(feature, effectivePlans())).toBe(true);
      expect(canUseFeature(feature, effectivePlans(["TEAM"]))).toBe(true);
    },
  );

  it("reserves paid grants for human review without gating self-study", () => {
    expect(canUseFeature("review", effectivePlans())).toBe(false);
    expect(canUseFeature("review", effectivePlans(["TEAM"]))).toBe(false);
    expect(canUseFeature("review", effectivePlans(["PRO"]))).toBe(true);
    expect(canUseFeature("review", effectivePlans(["REVIEW_ADDON"]))).toBe(true);
  });
});
