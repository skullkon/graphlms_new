import { notFound } from "next/navigation";
import { getChallenge, PROJECT_LAB_CLI_PATH } from "@/lib/projectLab.server";
import { ChallengeWorkspace } from "@/components/project-lab/ChallengeWorkspace";
import "@/components/project-lab/project-lab.css";
export default async function ChallengePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) notFound();
  return (
    <ChallengeWorkspace challenge={challenge} cliPath={PROJECT_LAB_CLI_PATH} />
  );
}
