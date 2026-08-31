import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export function POST(): Response {
  const response = NextResponse.json({ status: "success", data: null });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
