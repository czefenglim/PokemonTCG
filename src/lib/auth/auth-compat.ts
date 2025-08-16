import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export interface AuthUser {
  id: string; // session id or wallet, compat
  email?: string | null;
  walletAddress?: string; // lowercase if present
}

export interface DbUser {
  id: string;
  email: string;
  username: string;
}

/**
 * Try to read a NextAuth session user.
 * If you have custom authOptions, import and pass it to getServerSession.
 */
export async function getUserFromSession(): Promise<AuthUser | null> {
  try {
    const session = await getServerSession();
    if (session?.user) {
      return {
        id:
          (session.user.id as string) ||
          (session.user.email as string) ||
          'unknown',
        email: (session.user.email as string) ?? null,
        walletAddress: (session.user as any)?.walletAddress,
      };
    }
    return null;
  } catch (error) {
    console.warn('NextAuth session not available:', error);
    return null;
  }
}

/**
 * Read user from request headers (JWT + wallet address).
 * - Authorization: Bearer <token> (optional)
 * - X-Wallet-Address: 0xabc... (optional)
 */
export async function getUserFromRequest(
  req: NextRequest
): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get('authorization');
    const walletAddressRaw =
      req.headers.get('x-wallet-address') ||
      req.headers.get('X-Wallet-Address');

    const wallet = walletAddressRaw
      ? walletAddressRaw.toLowerCase()
      : undefined;
    const token = authHeader?.split(' ')[1];

    if (token && token !== 'undefined' && token !== 'null') {
      try {
        const { payload } = await jwtVerify(token, secret);
        return {
          id: (payload.sub as string) || wallet || 'unknown',
          email: (payload.email as string) ?? null,
          walletAddress: wallet,
        };
      } catch (e) {
        console.warn(
          'JWT verification failed; falling back to wallet only:',
          e
        );
      }
    }

    if (wallet) {
      return { id: wallet, walletAddress: wallet, email: null };
    }

    // neither session nor headers
    return null;
  } catch (error) {
    console.error('Failed to get user from request:', error);
    return null;
  }
}

/**
 * Compatibility helpers (unchanged signatures)
 */
export async function requireUserFromRequest(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    const err = new Error(
      'Unauthorized - User must be signed in or provide valid wallet'
    );
    (err as any).cause = { status: 401 };
    throw err;
  }
  return user;
}

export async function getCurrentUser(
  req?: NextRequest
): Promise<AuthUser | null> {
  if (req) return getUserFromRequest(req);
  return getUserFromSession();
}

export async function requireUser(req?: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    const err = new Error('Unauthorized - User must be signed in');
    (err as any).cause = { status: 401 };
    throw err;
  }
  return user;
}

/* ------------------------------------------------------------------------- */
/* NEW: resolve a REAL DB user (creates one if only wallet is present)       */
/* ------------------------------------------------------------------------- */

export async function ensureDbUserFromAuth(auth: AuthUser): Promise<DbUser> {
  // 1) Try by id (if it's a real DB id)
  if (auth.id) {
    const byId = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { id: true, email: true, username: true },
    });
    if (byId) return byId;
  }

  // 2) Try by email (from session)
  if (auth.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: auth.email },
      select: { id: true, email: true, username: true },
    });
    if (byEmail) return byEmail;
  }

  // 3) Try by wallet address (if present)
  if (auth.walletAddress) {
    const w = auth.walletAddress.toLowerCase();

    const existingByWallet = await prisma.user.findUnique({
      where: { walletAddress: w },
      select: { id: true, email: true, username: true },
    });
    if (existingByWallet) return existingByWallet;

    // Create wallet user with deterministic email
    const email = `${w}@local.invalid`;
    const username = `${w.slice(0, 6)}…${w.slice(-4)}`;
    const password = 'dev-auto';

    // Check if email already exists (edge case)
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true },
    });
    if (existingByEmail) return existingByEmail;

    // Create new wallet user
    const created = await prisma.user.create({
      data: {
        email,
        username,
        password,
        walletAddress: w, // ✅ Include wallet address
      },
      select: { id: true, email: true, username: true },
    });
    return created;
  }

  // 4) No wallet, no email - create anonymous user (if allowed)
  // This is for cases where you might want users without wallet/email
  if (auth.id && auth.id !== 'unknown') {
    try {
      const created = await prisma.user.create({
        data: {
          email: `anonymous-${auth.id}@local.invalid`,
          username: `user-${auth.id.slice(0, 8)}`,
          password: 'dev-auto',
          walletAddress: null, // ✅ Explicitly set as null (optional)
        },
        select: { id: true, email: true, username: true },
      });
      return created;
    } catch (error) {
      // Handle duplicate email case
      console.warn('Failed to create anonymous user:', error);
    }
  }

  const err = new Error('Unauthorized - could not resolve DB user');
  (err as any).status = 401;
  throw err;
}

/**
 * Convenience: resolve DB user directly from request or session.
 */
export async function requireDbUser(req?: NextRequest): Promise<DbUser> {
  const auth = await getCurrentUser(req);
  if (!auth) {
    const err = new Error('Unauthorized');
    (err as any).status = 401;
    throw err;
  }
  return ensureDbUserFromAuth(auth);
}
