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
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl">挡位</CardTitle>
      </CardHeader>
      <CardContent className="mt-3">
        <p>{gear}挡</p>
      </CardContent>
    </Card>
  );
};

export default GearShift;
