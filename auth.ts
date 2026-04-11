import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

export const isOidcEnabled = (): boolean =>
  process.env.OIDC_ENABLED === "true" &&
  !!process.env.OIDC_ISSUER &&
  !!process.env.OIDC_CLIENT_ID &&
  !!process.env.OIDC_CLIENT_SECRET;

const config: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: isOidcEnabled()
    ? [
        {
          id: "keycloak",
          name: "SSO",
          type: "oidc" as const,
          issuer: process.env.OIDC_ISSUER,
          clientId: process.env.OIDC_CLIENT_ID,
          clientSecret: process.env.OIDC_CLIENT_SECRET,
          authorization: { params: { scope: "openid email profile" } },
        },
      ]
    : [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, profile, account }) {
      if (account && profile) {
        token.email = (profile.email as string) ?? token.email;
        token.name = (profile.name as string) ?? token.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token.email) session.user.email = token.email as string;
      if (token.name) session.user.name = token.name as string;
      return session;
    },
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
