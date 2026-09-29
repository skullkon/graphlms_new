import { notFound, redirect } from "next/navigation";
export default async function Page({params}:{params:Promise<{num:string}>}){const {num}=await params;if(num!=="1")notFound();redirect("/system-design/practice");}
