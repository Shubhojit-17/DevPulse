import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/signin",
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "repo admin:repo_hook",
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          githubId: profile.id,
          login: profile.login,
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          avatarUrl: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id ?? token.sub ?? "";
      }
      session.accessToken =
        (token.accessToken as string | undefined) ??
        (user as { accessToken?: string } | null)?.accessToken ??
        null;
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (!account?.access_token || !profile) {
        return;
      }

      if (!("id" in profile) || !("login" in profile)) {
        return;
      }

      const avatarUrl =
        "avatar_url" in profile ? String(profile.avatar_url) : user.image;

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            accessToken: account.access_token,
            githubId: Number(profile.id),
            login: String(profile.login),
            avatarUrl,
            image: avatarUrl,
          },
        });
      } catch (error) {
        console.error('[accessToken storage error]', error);
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
