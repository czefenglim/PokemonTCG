// src/features/auth/types/next-auth.d.ts
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: string;
      address?: string;
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    email: string;
    role: string;
    name?: string;
    address?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    address?: string;
  }
}
