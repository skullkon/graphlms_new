export interface ChallengeStage {
  slug: string;
  name: string;
  group: string;
  descriptionPath: string;
  testerStage: string;
  prerequisites?: string[];
}
export interface Challenge {
  slug: string;
  title: string;
  shortName: string;
  description: string;
  upstreamUrl: string;
  sourceCommit: string;
  languages: string[];
  stages: ChallengeStage[];
  extensions?: { slug: string; name: string }[];
}
export interface ProjectLabRun {
  id: string;
  challenge: string;
  stage: string;
  language: string;
  passed: boolean;
  output: string;
  durationMs: number;
  submittedAt: string;
  sourceHash: string;
  passedStages?: string[];
}
