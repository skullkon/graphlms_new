import { describe, expect, it } from "vitest";
import { contradictions, emptyDraft, emptyProject, exportProject, inheritPrevious, MAX_HISTORY, parseProject, saveVersion, stages, updateDraft } from "./clubProject";
describe("Club project", () => {
  it("has sixteen actionable stages", () => {expect(stages).toHaveLength(16); for(const s of stages) for(const k of [s.task,s.artifact,s.criteria,s.change]) expect(k.length).toBeGreaterThan(20);});
  it("checks explicit pairs, not prose", () => {
    const d=emptyDraft(); d.fields.flow="zeroRPO asyncAckOnly"; expect(contradictions(d.controls)).toEqual([]);
    for(const [a,b] of [["instantRevocation","cachedPermissions"],["zeroRPO","asyncAckOnly"],["strictCapacity","independentRegionWrites"],["exactlyOnceExternal","noProviderDedup"]] as const) {
      const c={...d.controls,[a]:true};expect(contradictions(c)).toEqual([]);expect(contradictions({...c,[b]:true})).toHaveLength(1);
    }
    expect(contradictions(Object.fromEntries(Object.keys(d.controls).map(k=>[k,true])) as typeof d.controls)).toHaveLength(4);
  });
  it("preserves stages and snapshots independently", () => {
    let p=emptyProject(); const d=emptyDraft(); d.fields.data="Последнее место"; p=updateDraft(p,1,d); p=saveVersion(p,"2026-09-28T12:00:00.000Z"); d.fields.data="Изменено"; p=updateDraft({...p,selected:2},2,d);
    expect(p.drafts[0].fields.data).toBe("Последнее место");expect(p.history[0].draft.fields.data).toBe("Последнее место");expect(p.history[0].at).toBe("2026-09-28T12:00:00.000Z");
    expect(parseProject(exportProject(p,"json"))).toEqual(p);
    const md=exportProject(p,"md");expect(md).toContain("Последнее место");expect(md).toContain("Изменено");expect(md).toContain("Критерий:");expect(md).toContain("Версия 1");
  });
  it("does not silently prune history",()=>{let p=emptyProject();p.drafts[0].fields.flow="Путь запроса"; for(let i=0;i<MAX_HISTORY;i++)p=saveVersion(p);expect(()=>saveVersion(p)).toThrow(/64 версии/);expect(p.history).toHaveLength(64);});
  it("rejects corrupt, oversized and unsupported stored shapes",()=>{const p=emptyProject();for(const bad of [null,{}, {...p,schema:2},{...p,selected:17},{...p,drafts:[]},{...p,history:[{stage:1,at:"bad",draft:emptyDraft()}]}])expect(()=>parseProject(JSON.stringify(bad))).toThrow();const d=emptyDraft(); d.fields.flow="x".repeat(6001);expect(()=>updateDraft(p,1,d)).toThrow();expect(()=>parseProject("x".repeat(2_000_001))).toThrow();});
});

it("carries forward only into an empty stage and does not carry an old assessment",()=>{let p=emptyProject();p.drafts[0].fields.data="Места";p.drafts[0].score=3;p={...p,selected:2};const next=inheritPrevious(p);expect(next.drafts[1].fields.data).toBe("Места");expect(next.drafts[1].score).toBeNull();expect(p.drafts[1].fields.data).toBe("");expect(()=>inheritPrevious(next)).toThrow();});

it("rejects an empty version even with selected controls",()=>{const p=emptyProject();p.drafts[0].controls.zeroRPO=true;expect(()=>saveVersion(p)).toThrow(/опишите решение/);});
