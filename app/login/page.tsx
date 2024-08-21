"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { set, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { authenticate } from "@/lib/login";
import { LoginSchema } from "@/lib/schema";
import { useSetAtom } from "jotai";
import { isLoggedInAtom } from "@/lib/atom";

export default function Home() {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const setLoggedIn = useSetAtom(isLoggedInAtom);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof LoginSchema>) {
    setError("");
    setSuccess("");
    startTransition(() => {
      authenticate(values).then((data) => {
        setError(data.error);
        setSuccess(data.success);
        setLoggedIn(true);
      });
    });
  }

  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6 mt-10">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">登录</h1>
            <p className="text-balance text-muted-foreground">
              请在下方输入您的电子邮件以登录您的账户
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        placeholder=""
                        type="email"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      测试邮箱: user@nextmail.com
                    </FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>密码</FormLabel>
                    </div>

                    <FormControl>
                      <Input
                        disabled={isPending}
                        placeholder=""
                        {...field}
                        type="password"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>测试密码: 123456</FormDescription>
                  </FormItem>
                )}
              />
              <FormError mesaage={error} />
              <FormSuccess mesaage={success} />
              <Button type="submit" className="w-full">
                登录
              </Button>
              {/* <Button variant="outline" className="w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-github mr-2"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
                </svg>
                Github登录
              </Button> */}
              <div className="mt-4 text-center text-sm">
                还没有账户？
                <Link href="/register" className="underline">
                  立即注册
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
      <div className="hidden bg-muted lg:block h-screen">
        <Image
          src="/placeholder.svg"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}
