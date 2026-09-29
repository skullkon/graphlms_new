import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { Challenge, ProjectLabRun } from "./projectLab";

export const MAX_RUN_BYTES = 64 * 1024;
export function localRequestAllowed(
  request: Request,
  enabled: boolean,
): boolean {
  if (!enabled) return false;
  const local = new Set(["localhost", "127.0.0.1", "[::1]"]);
  const target = new URL(request.url);
  if (!local.has(target.hostname)) return false;
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const url = new URL(origin);
      if (!local.has(url.hostname) || url.port !== target.port) return false;
    } catch {
      return false;
    }
  }
  return true;
}
export async function ensureLocalToken(root: string): Promise<string> {
  const dir = path.join(root, ".local/project-lab");
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, "token");
  const pending = path.join(dir, randomUUID() + ".token.tmp");
  await fs.writeFile(pending, randomBytes(32).toString("hex"), {
    flag: "wx",
    mode: 0o600,
  });
  try {
    await fs.link(pending, file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  } finally {
    await fs.unlink(pending);
  }
  return (await fs.readFile(file, "utf8")).trim();
}
export function tokenMatches(
  authorization: string | null,
  token: string,
): boolean {
  if (!authorization?.startsWith("Bearer ")) return false;
  const actual = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(token);
  return (
    expected.length > 0 &&
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  );
}
export function validateLocalRun(
  input: unknown,
  challenges: Challenge[],
): Omit<ProjectLabRun, "id"> {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Ожидается отчёт CLI.");
  const x = input as Record<string, unknown>;
  const challenge = challenges.find((c) => c.slug === x.challenge);
  const stageIndex =
    challenge?.stages.findIndex((s) => s.slug === x.stage) ?? -1;
  if (!challenge || stageIndex < 0)
    throw new Error("Неизвестный проект или этап.");
  if (
    typeof x.language !== "string" ||
    !challenge.languages.includes(x.language)
  )
    throw new Error("Неизвестный язык проекта.");
  if (typeof x.passed !== "boolean")
    throw new Error("Отсутствует результат проверки.");
  if (typeof x.output !== "string" || Buffer.byteLength(x.output) > 48 * 1024)
    throw new Error("Слишком большой вывод проверки.");
  if (
    typeof x.durationMs !== "number" ||
    !Number.isFinite(x.durationMs) ||
    x.durationMs < 0 ||
    x.durationMs > 3_600_000
  )
    throw new Error("Некорректное время выполнения.");
  if (typeof x.sourceHash !== "string" || !/^[a-f0-9]{64}$/.test(x.sourceHash))
    throw new Error("Некорректный хеш исходников.");
  if (
    typeof x.submittedAt !== "string" ||
    x.submittedAt.length > 40 ||
    !Number.isFinite(Date.parse(x.submittedAt))
  )
    throw new Error("Некорректная дата проверки.");
  const passedStages = x.passedStages ?? (x.passed ? [x.stage] : []);
  if (
    !Array.isArray(passedStages) ||
    passedStages.length > challenge.stages.length ||
    passedStages.some(
      (s) =>
        typeof s !== "string" ||
        !challenge.stages
          .slice(0, stageIndex + 1)
          .some((stage) => stage.slug === s),
    )
  )
    throw new Error("Некорректный список пройденных этапов.");
  if (x.passed && !passedStages.includes(x.stage))
    throw new Error("Текущий этап не подтверждён отчётом.");
  return {
    challenge: challenge.slug,
    stage: challenge.stages[stageIndex].slug,
    language: x.language,
    passed: x.passed,
    output: x.output.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, ""),
    durationMs: x.durationMs,
    submittedAt: new Date(x.submittedAt).toISOString(),
    sourceHash: x.sourceHash,
    passedStages: [...new Set(passedStages)],
  };
}
export async function storeLocalRun(
  root: string,
  input: Omit<ProjectLabRun, "id">,
): Promise<ProjectLabRun> {
  const dir = path.join(root, ".local/project-lab/runs");
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const run = { ...input, id: randomUUID() };
  const tmp = path.join(dir, run.id + ".tmp");
  await fs.writeFile(tmp, JSON.stringify(run), { flag: "wx", mode: 0o600 });
  await fs.rename(tmp, path.join(dir, run.id + ".json"));
  return run;
}
export async function readLocalRuns(
  root: string,
  challenge?: string,
): Promise<ProjectLabRun[]> {
  const dir = path.join(root, ".local/project-lab/runs");
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const runs = await Promise.all(
    names
      .filter((n) => /^[a-f0-9-]{36}\.json$/.test(n))
      .map(async (n) => {
        try {
          return JSON.parse(
            await fs.readFile(path.join(dir, n), "utf8"),
          ) as ProjectLabRun;
        } catch {
          return null;
        }
      }),
  );
  return runs
    .filter(
      (r): r is ProjectLabRun =>
        !!r && (!challenge || r.challenge === challenge),
    )
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .map((r, i) => ({ ...r, output: i < 20 ? r.output : "" }));
}
