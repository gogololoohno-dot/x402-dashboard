import { NextResponse } from 'next/server';
import staticData from './data.json';

export async function GET() {
  // Serve pre-fetched static data
  // Data was fetched from Google Sheets on 2026-03-29
  // To update: re-fetch using the MCP Google Sheets tools

  return NextResponse.json(staticData, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  });
}
