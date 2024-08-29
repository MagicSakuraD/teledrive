import React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "./ui/button";
import Link from "next/link";

const Headerbar = () => {
  return (
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between border-b bg-background/30 px-4 backdrop-blur-sm">
      <Link href="/">
        <div className="flex flex-row gap-2 items-center justify-center">
          <Button variant="outline" size="icon" aria-label="Home">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 576 512"
              className="w-5 fill-current"
            >
              <path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z" />
            </svg>
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
