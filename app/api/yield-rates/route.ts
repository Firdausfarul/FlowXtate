import { NextResponse } from 'next/server';

// API endpoint that manages yield rates for tokens
// In production, this would use a real database (PostgreSQL, MongoDB, etc.)
// For demo purposes, this returns data that should be fetched from localStorage client-side
export async function GET() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // In a real implementation, this would query a database
  // For now, return a success response - the client will fetch from localStorage
  return NextResponse.json({
    success: true,
    message: "Yield rates should be fetched from localStorage in demo mode",
    timestamp: new Date().toISOString(),
  });
}

// POST endpoint to update yield rate for a token
export async function POST(request: Request) {
  const body = await request.json();
  const { tokenCode, dailyYieldRate } = body;

  // In production, this would update the database
  console.log(`Updated yield rate for ${tokenCode}: ${dailyYieldRate} XRP/day`);

  return NextResponse.json({
    success: true,
    message: `Yield rate updated for ${tokenCode}`,
    data: {
      tokenCode,
      dailyYieldRate,
      updatedAt: new Date().toISOString(),
    },
  });
}
