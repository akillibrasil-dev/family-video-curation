import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/entrar" },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "google" && account.providerAccountId) {
        token.ownerSubject = `google:${account.providerAccountId}`;
      }
      return token;
    },
    async session({ session, token }) {
      session.ownerSubject = typeof token.ownerSubject === "string" ? token.ownerSubject : undefined;
      return session;
    }
  }
});
