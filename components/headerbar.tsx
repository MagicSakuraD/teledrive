import React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { CarFront } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "./ui/button";
import Link from "next/link";

const Headerbar = () => {
  return (
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between border-b bg-background/30 px-4 backdrop-blur-sm">
      <Link href="/">
        <div className="flex flex-row gap-2 items-center justify-center">
          <Button variant="outline" size="icon" aria-label="Home">
            <CarFront className="size-6" />
          </Button>
          <h1 className="text-xl font-semibold">远程驾驶</h1>
        </div>
      </Link>

      <div className="flex flex-row gap-3 justify-center items-center">
        <ModeToggle />
        <UserAvatar />
      </div>
    </header>
  );
};

export default Headerbar;
