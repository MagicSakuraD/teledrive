"use client";

import { TrendingUp } from "lucide-react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

const chartConfig = {
  angle: {
    label: "Angle",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function Wheel({ rotation }: { rotation: number }) {
  const mapRotation = (rotation: number) => {
    const originalMin = -450;
    const originalMax = 450;
    const targetMin = 270;
    const targetMax = -90;

    // 计算比例因子
    const scaleFactor = (targetMax - targetMin) / (originalMax - originalMin);

    // 应用线性插值公式
    const mappedRotation = targetMin + (rotation - originalMin) * scaleFactor;

    return mappedRotation;
  };

  const chartData = [
    {
      angle: mapRotation(rotation),
      fill: "hsl(var(--chart-2))",
    },
  ];

  const startAngle = 90;
  const endAngle = chartData[0].angle;

  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl">方向盘</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ChartContainer
          config={chartConfig}
          className="flex justify-center items-center w-48 h-48"
        >
          <RadialBarChart
            data={chartData}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={70}
            outerRadius={100}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[76, 64]}
            />
            <RadialBar dataKey="angle" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-xl font-bold"
                        >
                          {rotation}°
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          转动角度
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
