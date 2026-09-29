import type { Metadata } from "next";
import { getBackendStages } from "@/lib/backend-path/content";
import { BackendPathView } from "@/components/backend-path/BackendPathView";
export const metadata: Metadata = { title: "Бесплатный путь: backend на Go — GraphLMS", description: "8 этапов от основ Go до собственного HTTP-сервиса: очередь, восстановление, тесты и защита архитектуры. Без регистрации и оплаты." };
export default function Page() { return <BackendPathView stages={getBackendStages().map(({ body, ...stage }) => stage)} />; }
