"use client";
import { auth } from "@/auth";
import { Session } from "next-auth";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import SignOut from "@/components/SignOut";
import Avatar from "boring-avatars";
import Link from "next/link";
import { useAtomValue } from "jotai";
import { isLoggedInAtom } from "@/lib/atom";

export default function UserAvatar() {
  const [session, setSession] = useState<Session | null>(null);
  const isLoggedIn = useAtomValue(isLoggedInAtom);

  useEffect(() => {
    const fetchSession = async () => {
      const result = await auth();
      setSession(result);
    };

    fetchSession();
  }, [isLoggedIn]);

  const handleSignOut = () => {
    setSession(null); // 设置 session 为 null，以触发 UI 更新
  };

  if (!session?.user) {
    return (
      <Link href="/login" className="text-violet-500 tracking-wide">
        <p>登录</p>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div>
          <span className="sr-only">Open user menu</span>
          <Avatar
            name={session.user?.email || "ckgoforit@outlook.com"}
            variant="beam"
            size={30}
            colors={["#dc2626", "#22c55e", "#2563eb", "#8b5cf6", "#e11d48"]}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <p>{session.user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <SignOut onSignOut={handleSignOut} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
