import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const Pedal = ({ brake, throttle }: { brake: number; throttle: number }) => {
  // 将 brake 和 throttle 转换为百分比格式
  const brakePercentage = `${Math.floor(brake * 100)}%`;
  const throttlePercentage = `${Math.floor(throttle * 100)}%`;

  return (
    <div>
      <ChartContainer
        config={{
          move: {
            label: "制动",
            color: "hsl(var(--chart-1))",
          },
          stand: {
            label: "油门",
            color: "hsl(var(--chart-3))",
          },
        }}
        className="h-[120px] w-full"
      >
        <BarChart
          margin={{
            left: 0,
            right: 0,
            top: 0,
            bottom: 10,
          }}
          data={[
            {
              activity: "制动",
              value: brake,
              label: brakePercentage,
              fill: "hsl(var(--chart-1))",
            },
            {
              activity: "油门",
              value: throttle,
              label: throttlePercentage,
              fill: "hsl(var(--chart-3))",
            },
          ]}
          layout="vertical"
          barSize={32}
          barGap={2}
        >
          <XAxis type="number" dataKey="value" domain={[0, 1]} />
          <YAxis
            dataKey="activity"
            type="category"
            tickLine={false}
            tickMargin={4}
            axisLine={false}
            className="capitalize"
          />

          <Bar dataKey="value" radius={5}>
            <LabelList
              position="insideLeft"
              dataKey="label"
              fill="white"
              offset={8}
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export default Pedal;
