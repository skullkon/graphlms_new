// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const saved = vi.hoisted(() => new Map<string,string>());
vi.mock("@/lib/progress",()=>({loadCode:(key:string)=>saved.get(key)??null,saveCode:(key:string,value:string)=>saved.set(key,value)}));
vi.mock("next/link",()=>({default:({children,href}:any)=><a href={href}>{children}</a>}));
vi.mock("@/lib/system-design/learningCycle",()=>({learningCycles:[{chapterSlug:"03-data",answer:1,title:"Последнее место",transfer:{prompt:"Перенесите решение в другой контекст.",answer:"Проверяем атомарность."}}]}));
import { ReviewPractice } from "./ReviewPractice";
import { REVIEW_KEY } from "@/lib/system-design/reviews";
let root:Root, container:HTMLDivElement;
function button(label:string) {return [...container.querySelectorAll("button")].find(b=>b.textContent===label)!;}
function write(text:string) {const input=container.querySelector("textarea")!;Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")!.set!.call(input,text);input.dispatchEvent(new Event("input",{bubbles:true}));}
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;saved.clear();container=document.createElement("div");document.body.append(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
describe("review practice",()=>{
 it("does not overwrite another window's draft on manual save or after self-review",()=>{
  saved.set("cycle-03-data",JSON.stringify({passed:true,checked:true,choice:1,draft:"x".repeat(40),attemptedAt:100}));
  act(()=>root.render(<ReviewPractice/>));act(()=>button("Последнее место").click());
  act(()=>write("Локальное решение: остаток и запись изменяются атомарно внутри транзакции."));
  saved.set("review-draft-03-data","Ответ из другого окна");
  act(()=>button("Сохранить черновик").click());
  expect(saved.get("review-draft-03-data")).toBe("Ответ из другого окна");
  expect(container.textContent).toContain("Черновик изменился в другом окне");
  act(()=>button("Сравнить с разбором").click());act(()=>button("Объяснил самостоятельно").click());
  expect(saved.get("review-draft-03-data")).toBe("Ответ из другого окна");
 });
 it("preserves unknown storage instead of overwriting it",()=>{saved.set(REVIEW_KEY,"broken");act(()=>root.render(<ReviewPractice/>));expect(container.querySelector('[role="alert"]')?.textContent).toContain("не перезаписано");expect(saved.get(REVIEW_KEY)).toBe("broken");expect(container.querySelector("textarea")).toBeNull();});
 it("shows entry guidance without fabricating progress",()=>{act(()=>root.render(<ReviewPractice/>));expect(container.textContent).toContain("Начните с самостоятельного сценария");expect(container.querySelector("textarea")).toBeNull();});
 it("requires an attempt before revealing and saves self-assessment without reusing an old answer",()=>{
  saved.set("cycle-03-data",JSON.stringify({passed:true,checked:true,choice:1,draft:"x".repeat(40),attemptedAt:Date.now()-172800000}));
  act(()=>root.render(<ReviewPractice/>));act(()=>button("Последнее место").click());
  expect(button("Сравнить с разбором").disabled).toBe(true);
  act(()=>write("Нужно атомарно проверить остаток и сохранить бронирование в одной транзакции."));
  act(()=>button("Сравнить с разбором").click());expect(container.textContent).toContain("Проверяем атомарность.");
  act(()=>button("Объяснил самостоятельно").click());expect(JSON.parse(saved.get(REVIEW_KEY)!).records["03-data"].rating).toBe("good");
  expect(container.querySelector("textarea")!.value).toBe("");expect(button("Сравнить с разбором").disabled).toBe(true);
 });
});
