import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Gauge from "./Gauge";

const CarSpeed = () => {
  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl">速度</CardTitle>
      </CardHeader>
      <CardContent className="mt-3">
        <Gauge value={60} min={0} max={100} label="Speed" units="m/s" />
      </CardContent>
    </Card>
  );
};

export default CarSpeed;
