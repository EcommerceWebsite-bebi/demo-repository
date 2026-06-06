import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    isTurso: !!process.env.TURSO_DATABASE_URL,
    hasAuthToken: !!process.env.TURSO_AUTH_TOKEN,
    databaseUrl: process.env.TURSO_DATABASE_URL 
      ? `${process.env.TURSO_DATABASE_URL.substring(0, 15)}...` 
      : 'not set',
  });
}
