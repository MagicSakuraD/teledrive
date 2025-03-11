"use client";
import React, { useMemo } from "react";
import {
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Line,
  ReferenceDot,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SafetyChartProps {
  safetyData: number[]; // 原始数据数组 [angle1, accel1, dist1, angle2, accel2, dist2, ...]
  title?: string;
  description?: string;
  currentAngle?: number; // 当前方向盘转角
  currentAcceleration?: number; // 当前加速度
}

// 简化的颜色映射，只需要2种颜色
const getPointColor = (distance: number) => {
  if (distance <= 2.0) return "#FF0000"; // 红色 - 2m
  return "#FFD700"; // 黄色 - 5m
};

const NoDataDisplay = () => (
  <text
    x="50%"
    y="50%"
    fill="#888888"
    textAnchor="middle"
    dominantBaseline="middle"
  >
    暂无数据
  </text>
);

const SafetyChart: React.FC<SafetyChartProps> = ({
  safetyData,
  title = "安全轮廓",
  description = "方向盘和加速度安全区域",
  currentAngle,
  currentAcceleration,
}) => {
  // 处理原始数据为图表友好格式
  const chartData = useMemo(() => {
    if (!safetyData || safetyData.length === 0) return [];

    const data = [];
    for (let i = 0; i < safetyData.length; i += 3) {
      if (i + 2 < safetyData.length) {
        data.push({
          angle: safetyData[i], // 方向角度（度）
          acceleration: safetyData[i + 1], // 加速度
          distance: safetyData[i + 2], // 预测距离
        });
      }
    }

    return data;
  }, [safetyData]);

  // 只保留2m和5m的数据进行分组
  const filteredGroups = useMemo(() => {
    if (!chartData.length) return [];

    // 创建距离映射表，只保留近似2m和5m的数据点
    const distanceMap = new Map();

    chartData.forEach((point) => {
      // 对距离值进行过滤，只保留约2m和约5m的点
      let targetDist = null;
      if (point.distance >= 1.8 && point.distance <= 2.2) targetDist = 2;
      else if (point.distance >= 4.8 && point.distance <= 5.2) targetDist = 5;

      if (targetDist) {
        if (!distanceMap.has(targetDist)) {
          distanceMap.set(targetDist, []);
        }
        distanceMap.get(targetDist).push(point);
      }
    });

    interface DistanceGroup {
      distance: number;
      points: Array<{ angle: number; acceleration: number; distance: number }>;
      color: string;
    }

    const result: DistanceGroup[] = [];
    distanceMap.forEach((points, dist) => {
      const sortedPoints = [...points].sort((a, b) => a.angle - b.angle);
      result.push({
        distance: dist,
        points: sortedPoints,
        color: getPointColor(dist),
      });
    });

    return result;
  }, [chartData]);

  const hasData = chartData.length > 0;

  // 只显示2m和5m的参考值
  const distanceValues = [2, 5];

  // 当前控制状态是否在图表范围内
  const isCurrentStateInRange =
    currentAngle !== undefined &&
    currentAcceleration !== undefined &&
    currentAngle >= -40 &&
    currentAngle <= 40 &&
    currentAcceleration >= -5 &&
    currentAcceleration <= 5;

  return (
    // 将现有的 div 容器修改为圆形
    <div
      className="rounded-full overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center"
      style={{ width: "200px", height: "200px", margin: "0 auto" }}
    >
      <CardContent className="p-0 w-full h-full">
        {/* 圆形图表容器 */}
        <div className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%" aspect={1}>
            <ComposedChart className="pr-9 pt-3">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="angle"
                name="角度"
                domain={[-40, 40]}
                // label={{
                //   value: "方向",
                //   position: "bottom",
                //   offset: -5,
                //   fontSize: 10,
                // }}
                tick={{ fontSize: 8 }}
              />
              <YAxis
                type="number"
                dataKey="acceleration"
                name="加速度"
                domain={[-5, 5]}
                // label={{
                //   value: "加速度",
                //   angle: -90,
                //   position: "insideLeft",
                //   offset: 5,
                //   fontSize: 10,
                // }}
                tick={{ fontSize: 8 }}
              />

              {!hasData && <NoDataDisplay />}

              {/* 只渲染2m和5m的轮廓线 */}
              {hasData &&
                filteredGroups.map((group, idx) => {
                  if (group.points.length >= 2) {
                    return (
                      <Line
                        key={`line-${idx}`}
                        type="monotone"
                        data={group.points}
                        dataKey="acceleration"
                        xAxisId={0}
                        yAxisId={0}
                        stroke={group.color}
                        strokeWidth={2}
                        name={`${group.distance}m`}
                        dot={false}
                        connectNulls={true}
                        isAnimationActive={false}
                      />
                    );
                  }
                  return null;
                })}

              {/* 渲染当前控制状态点 */}
              {isCurrentStateInRange && (
                <ReferenceDot
                  x={currentAngle}
                  y={currentAcceleration}
                  r={5}
                  fill="#FFFFFF"
                  stroke="#000000"
                  strokeWidth={1.5}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </div>
  );
};

export default SafetyChart;
