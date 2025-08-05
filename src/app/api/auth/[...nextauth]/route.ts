import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        // Dynamically assign ADMIN role
        const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
        let finalUser = user;

        if (adminEmails.includes(user.email) && user.role !== "ADMIN") {
          finalUser = await prisma.user.update({
            where: { email: user.email },
            data: { role: "ADMIN" },
          });
        }

        return {
          id: finalUser.id,
          email: finalUser.email,
          name: finalUser.username,
          role: finalUser.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      console.log("🔐 JWT token:", token); // ✅
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      console.log("📦 Session object:", session); // ✅
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/unauthorized", // You can define this if needed
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
