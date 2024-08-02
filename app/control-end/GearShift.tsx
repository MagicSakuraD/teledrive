import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface GearShiftProps {
  gear: string;
}

const GearShift: React.FC<GearShiftProps> = ({ gear }) => {
  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle>挡位</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center h-full">
        <p>{gear}挡</p>
      </CardContent>
    </Card>
  );
};

export default GearShift;
