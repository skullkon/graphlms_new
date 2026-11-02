import { getCourse } from "./courses";

export const PRACTICAL_COURSES = ["git", "linux", "databases", "algorithms", "vibecoding"] as const;
const labs = {
  git: "/downloads/git-labs.zip",
  linux: "/downloads/linux-labs.zip",
  databases: "/downloads/database-labs.zip",
  algorithms: "/downloads/algorithm-labs.zip",
  vibecoding: "/downloads/vibecoding-labs.zip",
};

/** Restrict the shared reader to the practical courses it actually serves. */
export function getPracticalCourse(id: string) {
  if (!PRACTICAL_COURSES.includes(id as typeof PRACTICAL_COURSES[number])) return null;
  const course = getCourse(id);
  return course ? { ...course, labsHref: labs[id as keyof typeof labs] } : null;
}
