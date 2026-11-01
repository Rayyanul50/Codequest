import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/queries";

export async function GET(req: Request) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const period = new URL(req.url).searchParams.get("period") === "weekly" ? "weekly" : "all";
  return NextResponse.json({ rows: await getLeaderboard(period, user.id) });
}
