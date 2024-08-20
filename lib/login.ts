import * as z from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

import { LoginSchema } from "@/lib/schema";

export let MyAcount = "MyAcount";

export async function authenticate(values: z.infer<typeof LoginSchema>) {
  // formData: FormData
  try {
    // 创建一个新的 FormData 实例
    const formData = new FormData();
    // 遍历 values 对象，并将每个键值对添加到 formData 中
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });

    await signIn("credentials", formData);
    return { success: "登录成功" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "用户名或密码错误" };
        default:
          return { error: "出错了,请重试" };
      }
    }
    // throw error;
    return { error: "邮箱或密码错误" };
  }
}
