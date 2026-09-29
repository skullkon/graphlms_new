import { describe, it, expect } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  ensureLocalToken,
  localRequestAllowed,
  readLocalRuns,
  storeLocalRun,
  tokenMatches,
  validateLocalRun,
} from "./projectLab.local";
import type { Challenge } from "./projectLab";
const catalog: Challenge[] = [
  {
    slug: "http-server",
    title: "HTTP",
    shortName: "HTTP",
    description: "",
    upstreamUrl: "",
    sourceCommit: "",
    languages: ["go"],
    stages: ["one", "two"].map((slug) => ({
      slug,
      name: slug,
      group: "Core",
      testerStage: slug,
      descriptionPath: "x",
    })),
  },
];
const report = {
  challenge: "http-server",
  stage: "one",
  language: "go",
  passed: true,
  output: "PASS",
  durationMs: 100,
  submittedAt: "2026-09-28T12:00:00.000Z",
  sourceHash: "a".repeat(64),
};
describe("local project report bridge", () => {
  it("is opt-in, rejects external hosts and cross-site requests", () => {
    expect(
      localRequestAllowed(new Request("http://localhost:3000/api"), false),
    ).toBe(false);
    expect(
      localRequestAllowed(new Request("http://localhost:3000/api"), true),
    ).toBe(true);
    expect(
      localRequestAllowed(new Request("https://example.com/api"), true),
    ).toBe(false);
    expect(
      localRequestAllowed(
        new Request("http://localhost:3000/api", {
          headers: { origin: "https://evil.example" },
        }),
        true,
      ),
    ).toBe(false);
    expect(
      localRequestAllowed(
        new Request("http://localhost:3000/api", {
          headers: { "sec-fetch-site": "cross-site" },
        }),
        true,
      ),
    ).toBe(false);
  });
  it("accepts actual known stages but rejects invented and future completions", () => {
    expect(validateLocalRun(report, catalog).passedStages).toEqual(["one"]);
    expect(() =>
      validateLocalRun({ ...report, stage: "../../token" }, catalog),
    ).toThrow();
    expect(() =>
      validateLocalRun({ ...report, passed: "true" }, catalog),
    ).toThrow();
    expect(() =>
      validateLocalRun({ ...report, passedStages: ["one", "two"] }, catalog),
    ).toThrow();
    expect(() =>
      validateLocalRun({ ...report, sourceHash: "invalid" }, catalog),
    ).toThrow();
    expect(() =>
      validateLocalRun({ ...report, output: "x".repeat(50 * 1024) }, catalog),
    ).toThrow();
  });
  it("keeps a stable private token and does not accept missing or partial credentials", async () => {
    const dir = await fs.mkdtemp(
      path.join(os.tmpdir(), "graphlms-token-test-"),
    );
    try {
      const [a, b] = await Promise.all([
        ensureLocalToken(dir),
        ensureLocalToken(dir),
      ]);
      expect(a).toEqual(b);
      expect(a).toMatch(/^[a-f0-9]{64}$/);
      expect(tokenMatches("Bearer " + a, a)).toBe(true);
      expect(tokenMatches(null, a)).toBe(false);
      expect(tokenMatches("Bearer " + a.slice(1), a)).toBe(false);
      expect(
        (await fs.stat(path.join(dir, ".local/project-lab/token"))).mode &
          0o077,
      ).toBe(0);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
  it("persists concurrent real reports without losing history and filters by challenge", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "graphlms-runs-test-"));
    try {
      const run = validateLocalRun(report, catalog);
      await Promise.all(
        Array.from({ length: 8 }, () => storeLocalRun(dir, run)),
      );
      const runs = await readLocalRuns(dir, "http-server");
      expect(runs).toHaveLength(8);
      expect(new Set(runs.map((r) => r.id)).size).toBe(8);
      expect(await readLocalRuns(dir, "redis")).toEqual([]);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
