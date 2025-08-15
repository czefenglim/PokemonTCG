// src/lib/battle-pve/api-utils.ts
import { getSession } from 'next-auth/react';
import { ethers } from 'ethers';

async function readError(response: Response) {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json?.error || text || `HTTP ${response.status}`;
  } catch {
    return text || `HTTP ${response.status}`;
  }
}

/** Signed call helper */
export async function makeBattleAPICall(
  endpoint: string,
  options: RequestInit = {}
) {
  try {
    if (typeof window === 'undefined') {
      // never try to use window/ethereum on the server
      throw new Error('Client-only request attempted on server');
    }
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum as any);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const session = await getSession();

    const headers: HeadersInit = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Wallet-Address': address,
      ...(options.headers || {}),
    };
    if (session?.accessToken) {
      (headers as any).Authorization = `Bearer ${session.accessToken}`;
    }

    const response = await fetch(endpoint, {
      credentials: 'same-origin', // ensure cookies (next-auth) are sent
      ...options,
      headers,
    });

    if (!response.ok) {
      const msg = await readError(response);
      throw new Error(`${msg} [${response.status}] ${endpoint}`);
    }
    return await response.json();
  } catch (err) {
    console.error('Battle API call failed:', err);
    throw err;
  }
}

/** Create a new battle (signed) */
export async function createBattle(opponentId: string, deckId: string) {
  return makeBattleAPICall('/api/battle-pve/battles', {
    method: 'POST',
    body: JSON.stringify({ opponentId, deckId }),
  });
}

/** Load battle state (unsigned fallback if no wallet) */
export async function loadBattle(battleId: string) {
  if (typeof window !== 'undefined' && !window.ethereum) {
    const res = await fetch(`/api/battle-pve/battles/${battleId}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      const msg = await readError(res);
      throw new Error(
        `${msg} [${res.status}] /api/battle-pve/battles/${battleId}`
      );
    }
    return res.json();
  }
  return makeBattleAPICall(`/api/battle-pve/battles/${battleId}`);
}

/** Send battle action (signed) */
export async function sendBattleAction(battleId: string, action: any) {
  return makeBattleAPICall(`/api/battle-pve/battles/${battleId}/action`, {
    method: 'PATCH',
    body: JSON.stringify(action),
  });
}
