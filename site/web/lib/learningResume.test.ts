import { describe, expect, it } from "vitest";
import { findLearningResume, type ResumeItem } from "./learningResume";
import type { LearningEvent } from "./progress";

const items: ResumeItem[] = [
  {
    id: "go:chapter:channels",
    href: "/book/channels",
    title: "Каналы",
    kind: "chapter",
    courseId: "go",
  },
  {
    id: "hello",
    href: "/go-basics/tasks/hello",
    title: "Привет",
    kind: "task",
    courseId: "go-basics",
  },
  {
    id: "hello",
    href: "/tasks/hello",
    title: "Hello",
    kind: "task",
    courseId: "go",
  },
];
const event = (
  itemId: string,
  type: LearningEvent["type"] = "started",
  at = "2026-09-01T10:00:00Z",
  courseId?: string,
): LearningEvent => ({ id: `${itemId}:${at}`, itemId, type, at, courseId });

describe("learning resume", () => {
  it("does not manufacture progress from visits or unknown items", () => {
    expect(
      findLearningResume(
        [
          event("landing", "landing_view"),
          event("https://evil.example"),
          event("project:one"),
        ],
        items,
      ),
    ).toBeNull();
  });
  it("chooses the most recent known item regardless of event ordering", () => {
    expect(
      findLearningResume(
        [
          event("hello", "completed", "2026-09-03T10:00:00Z", "go-basics"),
          event(items[0].id),
          event("unknown", "started", "2026-09-04T10:00:00Z"),
        ],
        items,
      ),
    ).toEqual(items[1]);
  });
  it("disambiguates task IDs by course and preserves legacy Go events", () => {
    expect(
      findLearningResume([event("hello", "started", undefined, "os")], items),
    ).toBeNull();
    expect(findLearningResume([event("hello")], items)).toEqual(items[2]);
  });
  it("rejects invalid timestamps and unsafe supplied destinations", () => {
    expect(
      findLearningResume([event(items[0].id, "started", "invalid")], items),
    ).toBeNull();
    for (const href of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
    ]) {
      expect(
        findLearningResume([event(items[0].id)], [{ ...items[0], href }]),
      ).toBeNull();
    }
  });
});
