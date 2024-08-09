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
  return <div className="flex items-center">{gear}挡</div>;
};

export default GearShift;
