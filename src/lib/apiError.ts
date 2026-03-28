import { NextResponse } from "next/server"

export interface ApiError {
  error: string
  code:  string
}

export function apiError(
  error: string,
  code: string,
  status: number,
): NextResponse<ApiError> {
  return NextResponse.json({ error, code }, { status })
}
