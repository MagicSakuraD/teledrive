"use client";
import React from "react";
import { signOut } from "@/auth";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

const SignOut = () => {
  return (
    <DropdownMenuItem
      onClick={async () => {
        await signOut();
      }}
    >
      <LogOut className="w-4 h-4" />
      注销
    </DropdownMenuItem>
  );
};

export default SignOut;
