import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

const Pedal = ({ brake, throttle }: { brake: number; throttle: number }) => {
  // 将 brake 和 throttle 转换为百分比格式
  const brakePercentage = `${Math.floor(brake * 100)}%`;
  const throttlePercentage = `${Math.floor(throttle * 100)}%`;

  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl">踏板</CardTitle>
      </CardHeader>
      <CardContent className="mt-3">
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
          className="h-[140px] w-full"
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
            <XAxis type="number" dataKey="value" hide />
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
      </CardContent>
    </Card>
  );
};

export default Pedal;
