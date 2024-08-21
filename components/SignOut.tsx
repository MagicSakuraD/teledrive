"use client";
import React from "react";
import { signOut } from "@/auth";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const SignOut = ({ onSignOut }: { onSignOut: () => void }) => {
  const { toast } = useToast();
  return (
    <DropdownMenuItem
      onClick={async () => {
        await signOut({ redirectTo: "/" });
        onSignOut(); // 通知父组件已退出
        toast({
          title: "✅退出成功",
        });
      }}
    >
      <LogOut className="w-4 h-4" />
      <p className="ml-2">登出</p>
    </DropdownMenuItem>
  );
};

export default SignOut;
