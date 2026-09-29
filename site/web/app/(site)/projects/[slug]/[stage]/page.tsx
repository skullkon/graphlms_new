import { notFound } from "next/navigation";
import {
  getChallenge,
  getStageMarkdown,
  PROJECT_LAB_CLI_PATH,
} from "@/lib/projectLab.server";
import { renderMarkdown } from "@/lib/markdown";
import { ChallengeWorkspace } from "@/components/project-lab/ChallengeWorkspace";
import "@/components/project-lab/project-lab.css";
export default async function StagePage({
  params,
}: {
  params: Promise<{ slug: string; stage: string }>;
}) {
  const { slug, stage } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) notFound();
  const item = challenge.stages.find((s) => s.slug === stage);
  if (!item) notFound();
  const html = await renderMarkdown(getStageMarkdown(challenge, item));
  return (
    <ChallengeWorkspace
      challenge={challenge}
      stageSlug={stage}
      html={html}
      cliPath={PROJECT_LAB_CLI_PATH}
    />
  );
}
