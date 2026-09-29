// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ClubProject } from "../../components/system-design/ClubProject";
import { emptyProject, PROJECT_KEY } from "./clubProject";
const storage=vi.hoisted(()=>({value:null as string|null,fail:false}));
vi.mock("@/lib/progress",()=>({loadCode:()=>storage.value,saveCode:(_key:string,value:string)=>{if(!storage.fail)storage.value=value;}}));
let host:HTMLDivElement;let root:ReturnType<typeof createRoot>;
beforeEach(()=>{(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;storage.value=null;storage.fail=false;host=document.createElement("div");document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();});
it("loads a chapter stage, keeps earlier draft and creates an immutable visible version",()=>{
  const p=emptyProject();p.drafts[0].fields.flow="Сохранённый путь";storage.value=JSON.stringify(p);
  act(()=>root.render(<ClubProject initialStage={2}/>));expect((host.querySelector("#club-stage") as HTMLSelectElement).value).toBe("2");
  const select=host.querySelector("#club-stage") as HTMLSelectElement;act(()=>{select.value="1";select.dispatchEvent(new Event("change",{bubbles:true}));});
  expect((host.querySelector("#club-flow") as HTMLTextAreaElement).value).toBe("Сохранённый путь");
  const button=Array.from(host.querySelectorAll("button")).find(b=>b.textContent==="Сохранить версию этапа")!;act(()=>button.click());expect(host.textContent).toContain("Версия 1");expect(JSON.parse(storage.value!).history[0].draft.fields.flow).toBe("Сохранённый путь");
});
it("shows failed persistence and keeps the selected state available for export",()=>{act(()=>root.render(<ClubProject/>));storage.fail=true;const select=host.querySelector("#club-stage") as HTMLSelectElement;act(()=>{select.value="3";select.dispatchEvent(new Event("change",{bubbles:true}));});expect(host.querySelector('[role="alert"]')?.textContent).toContain("Не удалось сохранить");expect(select.value).toBe("3");expect(host.textContent).toContain("Скачать JSON");});
it("does not replace a malformed saved project",()=>{storage.value='{"schema":999}';act(()=>root.render(<ClubProject/>));expect(host.querySelector('[role="alert"]')).not.toBeNull();expect(storage.value).toBe('{"schema":999}');expect(host.querySelector("textarea")).toBeNull();expect(PROJECT_KEY).toBe("club-project-v1");});
it("preserves external updates and keeps the local draft exportable on conflict",()=>{act(()=>root.render(<ClubProject/>));const external=emptyProject();external.drafts[0].fields.flow="Другая вкладка";const raw=JSON.stringify(external);storage.value=raw;const select=host.querySelector("#club-stage") as HTMLSelectElement;act(()=>{select.value="2";select.dispatchEvent(new Event("change",{bubbles:true}));});expect(storage.value).toBe(raw);expect(select.value).toBe("2");expect(host.querySelector('[role="alert"]')?.textContent).toContain("другой вкладке");expect(host.textContent).toContain("Скачать JSON");const retry=Array.from(host.querySelectorAll("button")).find(b=>b.textContent==="Повторить сохранение")!;act(()=>retry.click());expect(storage.value).toBe(raw);});
