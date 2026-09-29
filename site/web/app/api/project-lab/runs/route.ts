import { NextResponse } from "next/server";
import { getChallenges, PROJECT_LAB_ROOT } from "@/lib/projectLab.server";
import {
  ensureLocalToken,
  localRequestAllowed,
  MAX_RUN_BYTES,
  readLocalRuns,
  storeLocalRun,
  tokenMatches,
  validateLocalRun,
} from "@/lib/projectLab.local";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const enabled = () => process.env.PROJECT_LAB_LOCAL === "1";
export async function GET(req: Request) {
  if (!localRequestAllowed(req, enabled()))
    return NextResponse.json(
      { enabled: false, runs: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  await ensureLocalToken(PROJECT_LAB_ROOT);
  const challenge = new URL(req.url).searchParams.get("challenge") || undefined;
  if (challenge && !getChallenges().some((c) => c.slug === challenge))
    return NextResponse.json({ error: "Неизвестный проект." }, { status: 400 });
  return NextResponse.json(
    { enabled: true, runs: await readLocalRuns(PROJECT_LAB_ROOT, challenge) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(req: Request) {
  if (!localRequestAllowed(req, enabled()))
    return NextResponse.json(
      { error: "Локальный приём отчётов выключен." },
      { status: 403 },
    );
  if (
    !tokenMatches(
      req.headers.get("authorization"),
      await ensureLocalToken(PROJECT_LAB_ROOT),
    )
  )
    return NextResponse.json(
      { error: "Неверный токен локального CLI." },
      { status: 401 },
    );
  if (Number(req.headers.get("content-length")) > MAX_RUN_BYTES)
    return NextResponse.json(
      { error: "Слишком большой отчёт." },
      { status: 413 },
    );
  const reader = req.body?.getReader();
  if (!reader)
    return NextResponse.json({ error: "Пустой отчёт." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_RUN_BYTES) {
      await reader.cancel();
      return NextResponse.json(
        { error: "Слишком большой отчёт." },
        { status: 413 },
      );
    }
    chunks.push(value);
  }
  try {
    const input = validateLocalRun(
      JSON.parse(Buffer.concat(chunks).toString("utf8")),
      getChallenges(),
    );
    const run = await storeLocalRun(PROJECT_LAB_ROOT, input);
    return NextResponse.json(
      { run },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Некорректный отчёт." },
      { status: 400 },
    );
  }
}
