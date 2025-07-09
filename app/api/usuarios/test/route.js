import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";

export async function GET() {
  try {
    // Test endpoint for users
    const usersCount = await prisma.usuario.count();

    return NextResponse.json({
      success: true,
      message: "Users API test endpoint",
      timestamp: new Date().toISOString(),
      usersCount,
    });
  } catch (error) {
    console.error("Users test API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
