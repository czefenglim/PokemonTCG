import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get filter parameters from query string
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const merchandiseId = searchParams.get("merchandiseId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const email = searchParams.get("email");
    const phoneNumber = searchParams.get("phoneNumber"); // ✅ Added

    // Build the where clause for filtering
    const where: any = {};

    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (merchandiseId) where.merchandiseId = merchandiseId;

    // ✅ Phone number filtering (sequence only)
    if (phoneNumber) {
      where.phoneNumber = {
        contains: phoneNumber, // exact sequence match
      };
    }

    // Date range filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); // start of the day
        where.createdAt.gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // end of the day
        where.createdAt.lte = end;
      }

    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        merchandise: true,
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
