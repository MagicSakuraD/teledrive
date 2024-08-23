"use client";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { register } from "@/lib/register";
import { useState, useTransition } from "react";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { RegisterSchema } from "@/lib/schema";

function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof RegisterSchema>) {
    setError("");
    setSuccess("");
    startTransition(() => {
      register(values).then((data) => {
        setError(data.error);
        setSuccess(data.success);
      });
    });
  }

  return (
    <main className="container my-auto">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">注册</CardTitle>
          <CardDescription>输入您的信息以创建帐户</CardDescription>
        </CardHeader>
        <CardContent>
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
                        placeholder="slam@example.com"
                        type="email"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
                        placeholder="slam"
                        {...field}
                        type="password"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormError mesaage={error} />
              <FormSuccess mesaage={success} />
              <Button type="submit" className="w-full">
                注册
              </Button>

              <div className="mt-4 text-center text-sm">
                已经有账户？
                <Link href="/login" className="underline">
                  立即登录
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}

export default RegisterPage;
