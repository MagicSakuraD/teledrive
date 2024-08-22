"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Car, Gamepad2 } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="container max-w-[60rem] flex flex-col justify-between items-center">
      <div className=""></div>
      <RadioGroup
        defaultValue="card"
        className="flex flex-col gap-4 md:flex-row"
      >
        <div className="w-52 md:min-w-96">
          <RadioGroupItem value="paypal" id="paypal" className="peer sr-only" />
          <Link href="/control-end">
            <Label
              htmlFor="paypal"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Gamepad2 className="mb-3 w-36 h-36" strokeWidth={1.5} />
              控制端
            </Label>
          </Link>
        </div>
        <div className="w-52 md:min-w-96">
          <RadioGroupItem value="apple" id="apple" className="peer sr-only" />
          <Link href="/car-end">
            <Label
              htmlFor="apple"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Car className="mb-3 w-36 h-36" strokeWidth={1.5} />
              车端
            </Label>
          </Link>
        </div>
      </RadioGroup>
      <footer className="text-center text-sm text-muted-foreground">
        <div className="flex flex-row items-center gap-2 justify-center">
          <p className="text-xs hidden xl:inline">
            © 2024 CyberC3 Intelligent Vehicle Lab.
          </p>
          <p className="text-xs">
            <span className="font-medium">沪交ICP备</span>20240195
          </p>
        </div>
      </footer>
    </div>
  );
}
