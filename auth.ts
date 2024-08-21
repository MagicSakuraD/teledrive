"use server";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma"; // 确保正确导入你的 Prisma 客户端
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { z } from "zod";
import bcrypt from "bcrypt";
import { LoginSchema } from "@/lib/schema";

export const { auth, signIn, signOut } = NextAuth({
  // adapter: PrismaAdapter(prisma),
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = LoginSchema.safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password!);

          if (passwordsMatch) return user;
        }
        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});
