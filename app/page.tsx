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
    <div className="container mt-20 max-w-[56rem]">
      <RadioGroup
        defaultValue="card"
        className="flex flex-col gap-4 md:flex-row"
      >
        <div className="min-w-96">
          <RadioGroupItem value="paypal" id="paypal" className="peer sr-only" />
          <Link href="/control">
            <Label
              htmlFor="paypal"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Gamepad2 className="mb-3 w-36 h-36" strokeWidth={1.5} />
              控制端
            </Label>
          </Link>
        </div>
        <div className="min-w-96">
          <RadioGroupItem value="apple" id="apple" className="peer sr-only" />
          <Link href="/car">
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
    </div>
  );
}
