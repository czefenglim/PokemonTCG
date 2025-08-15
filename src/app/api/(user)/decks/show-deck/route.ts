import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/db/prisma';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function GET(req: Request) {
  try {
    console.log('=== DEBUG: Show-deck route called ===');

    // Get headers
    const authHeader = req.headers.get('authorization');
    const walletAddress = req.headers.get('x-wallet-address');

    console.log('Auth header:', authHeader);
    console.log('Wallet address:', walletAddress);

    // Check if wallet address is provided
    if (!walletAddress) {
      console.log('ERROR: Missing wallet address');
      return NextResponse.json(
        { error: 'Missing wallet address' },
        { status: 400 }
      );
    }

    // OPTIONAL JWT verification - only verify if token is provided
    const token = authHeader?.split(' ')[1];

    if (token && token !== 'undefined' && token !== 'null') {
      try {
        const { payload } = await jwtVerify(token, secret);
        console.log('JWT verification successful:', payload);
      } catch (jwtError) {
        console.log(
          'JWT verification failed, but continuing with wallet-only auth:',
          jwtError
        );
        // Don't return error - continue with wallet address authentication
      }
    } else {
      console.log('No JWT token provided, using wallet-only authentication');
    }

    console.log(
      'Searching for decks with userAddress:',
      walletAddress.toLowerCase()
    );

    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    // Fetch decks based on wallet address
    const decks = await prisma.deck.findMany({
      where: { userAddress: walletAddress.toLowerCase() },
      include: { cards: true },
    });

    console.log('Found decks:', decks.length);

    return NextResponse.json({ decks });
  } catch (error) {
    console.error('GET /api/decks error:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
