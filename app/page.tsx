"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function Dashboard() {
  return (
    <div>
      <Card className="min-w-[1000px]">
        <CardHeader className="bg-muted/100">
          <CardTitle>car camera</CardTitle>
        </CardHeader>
        <CardContent>
          <AspectRatio ratio={16 / 9}></AspectRatio>
        </CardContent>
      </Card>
    </div>
  );
}
