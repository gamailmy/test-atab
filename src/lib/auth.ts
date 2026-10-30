import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * Konfigurasi NextAuth dengan Credentials Provider.
 *
 * Username & password dibaca dari environment variables:
 *   - AUTH_USERNAME (default: admin)
 *   - AUTH_PASSWORD (default: emon2026)
 *
 * Untuk production di Vercel, WAJIB set:
 *   - NEXTAUTH_SECRET (generate: openssl rand -base64 32)
 *   - AUTH_USERNAME & AUTH_PASSWORD (ganti dari default)
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validUser = process.env.AUTH_USERNAME || "admin";
        const validPass = process.env.AUTH_PASSWORD || "emon2026";

        if (
          credentials?.username === validUser &&
          credentials?.password === validPass
        ) {
          return {
            id: "1",
            name: validUser,
            email: `${validUser}@emon.local`,
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name as string;
      }
      return session;
    },
  },
};
