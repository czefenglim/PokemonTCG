// types/Battle.ts

import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      address?: string;
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    address?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    address?: string;
  }
}
