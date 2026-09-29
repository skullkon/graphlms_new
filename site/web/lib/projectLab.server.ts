import fs from "node:fs";
import path from "node:path";
import type { Challenge, ChallengeStage } from "./projectLab";
export const PROJECT_LAB_ROOT =
  process.env.GRAPHLMS_ROOT || path.resolve(process.cwd(), "../..");
export const PROJECT_LAB_CLI_PATH = path.join(
  PROJECT_LAB_ROOT,
  "tools/project-lab/cli.mjs",
);
const contentRoot = path.join(PROJECT_LAB_ROOT, "challenges");
export function getChallenges(): Challenge[] {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(contentRoot, "catalog.json"), "utf8"),
  );
  if (catalog.version !== 1 || !Array.isArray(catalog.challenges))
    throw new Error("Invalid project catalogue");
  return catalog.challenges.map((challenge: Challenge) => {
    const locale = JSON.parse(
      fs.readFileSync(
        path.join(contentRoot, "locales/ru", `${challenge.slug}.json`),
        "utf8",
      ),
    ) as {
      shortName?: string;
      stages: Record<string, string>;
      extensions: Record<string, string>;
    };
    return {
      ...challenge,
      shortName: locale.shortName || challenge.shortName,
      stages: challenge.stages.map((stage) => ({
        ...stage,
        name: locale.stages[stage.slug] || stage.name,
      })),
      extensions: challenge.extensions?.map((extension) => ({
        ...extension,
        name: locale.extensions[extension.slug] || extension.name,
      })),
    };
  });
}
export function getChallenge(slug: string): Challenge | undefined {
  return getChallenges().find((c) => c.slug === slug);
}
export function getStageMarkdown(
  challenge: Challenge,
  stage: ChallengeStage,
): string {
  if (
    !challenge.stages.some(
      (s) =>
        s.slug === stage.slug && s.descriptionPath === stage.descriptionPath,
    )
  )
    throw new Error("Unknown stage");
  const file = path.resolve(
    contentRoot,
    stage.descriptionPath.replace(/^content\//, "content-ru/"),
  );
  if (!file.startsWith(contentRoot + path.sep))
    throw new Error("Invalid stage path");
  return fs.readFileSync(file, "utf8");
}
