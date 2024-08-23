import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GearShiftProps {
  gear: string;
}

const GearShift: React.FC<GearShiftProps> = ({ gear }) => {
  return (
    <div>
      <div className="text-sm text-muted-foreground">挡位</div>
      <div className="text-xl font-bold tabular-nums leading-none">{gear}</div>
    </div>
  );
};

export default GearShift;
