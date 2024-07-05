import React from "react";

import { Video, Triangle, CarFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AsideBar = () => {
  return (
    <aside className="inset-y fixed  left-0 z-20 flex h-full flex-col border-r">
      <div className="border-b p-2">
        <Button variant="outline" size="icon" aria-label="Home">
          <Triangle className="size-5 fill-foreground" />
        </Button>
      </div>

      <nav className="grid gap-1 p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg"
                aria-label="Playground"
              >
                <CarFront className="size-5" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={5}>
            远程驾驶
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/peer">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg"
                aria-label="Playground"
              >
                <Video className="size-5" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={5}>
            video chat
          </TooltipContent>
        </Tooltip>
      </nav>
      {/* <nav className="mt-auto grid gap-1 p-2">
        <Tooltip>
          <TooltipTrigger asChild></TooltipTrigger>
          <TooltipContent side="right" sideOffset={5}>
            Account
          </TooltipContent>
        </Tooltip>
      </nav> */}
    </aside>
  );
};

export default AsideBar;
