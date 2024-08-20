"use server";
import * as z from "zod";
import bcrypt from "bcrypt";
import { RegisterSchema } from "@/lib/schema";
import { prisma } from "@/lib/prisma"; // 确保正确导入你的 Prisma 客户端
import { get } from "http";
import { getUserByEmail } from "@/lib/user";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validateFields = RegisterSchema.safeParse(values);
  if (!validateFields.success) {
    return { error: "出错了,请重试" };
  }
  const { email, password } = validateFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "邮箱已存在" };
  }

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
  // TODO: Send verification token email
  return { success: "注册成功" };
};
