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
    <div className="mt-2">
      <Gauge value={100} min={0} max={100} label="Speed" units="m/s" />
    </div>
  );
};

export default CarSpeed;
