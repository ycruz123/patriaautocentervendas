import { NextResponse } from "next/server";
import { getPerdasStats } from "@/lib/dashboard";

export async function GET() {
  const stats = await getPerdasStats();
  return NextResponse.json(stats);
}
