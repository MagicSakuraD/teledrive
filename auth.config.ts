import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = ["/control-end", "/car-end"];
      const isProtectedPage = protectedPaths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );

      if (isProtectedPage) {
        if (isLoggedIn) {
          return true; // Allow access to protected pages
        }
        return false; // Redirect unauthenticated users to login page
      }

      // Allow access to all other pages if not logged in
      return true;
    },
  },
  providers: [GitHub],
};
