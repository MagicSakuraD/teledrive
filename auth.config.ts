import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import { NextResponse } from "next/server";

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
      } else if (isLoggedIn && nextUrl.pathname.includes("/login")) {
        // if (nextUrl.pathname.endsWith("control-end")) {
        //   return NextResponse.redirect(new URL("/control-end", nextUrl));
        // } else if (nextUrl.pathname.endsWith("car-end")) {
        //   return NextResponse.redirect(new URL("/car-end", nextUrl));
        // }
        return NextResponse.redirect(new URL("/", nextUrl));
      }

      // Allow access to all other pages if not logged in
      return true;
    },
  },
  providers: [GitHub],
};
