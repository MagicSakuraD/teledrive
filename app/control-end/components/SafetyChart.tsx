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

// 更新颜色映射，支持所有5个距离
const getPointColor = (distance: number) => {
  switch (distance) {
    case 0.2:
      return "#b91c1c"; // 红色 - 0.2m，危险
    case 0.5:
      return "#f43f5e"; // 玫瑰红 - 0.5m，警告
    case 1:
      return "#ea580c"; // 橘色 - 1m，注意
    case 2:
      return "#84cc16"; // 绿色 - 2m，安全
    case 5:
      return "#22c55e"; // 绿色 - 5m，安全
    default:
      return ""; // 排除其他距离
  }
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
  // 添加调试日志

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

  // 更新为包含所有距离值的数据分组
  const filteredGroups = useMemo(() => {
    if (!chartData.length) return [];

    // 创建距离映射表，保留所有需要的距离点
    const distanceMap = new Map();

    chartData.forEach((point) => {
      // 更新为精确匹配枚举值
      if ([0.2, 0.5, 1, 2, 5].includes(point.distance)) {
        if (!distanceMap.has(point.distance)) {
          distanceMap.set(point.distance, []);
        }
        distanceMap.get(point.distance).push(point);
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

  // 添加调试信息
  console.log("SafetyChart - 处理后的数据组数:", filteredGroups.length);
  filteredGroups.forEach((group, idx) => {
    console.log(
      `距离 ${group.distance}m: ${group.points.length} 个点, 颜色: ${group.color}`
    );
  });

  const hasData = chartData.length > 0;

  // 更新为包含所有距离值
  const distanceValues = [0.2, 0.5, 1, 2, 5];

  // 当前控制状态是否在图表范围内
  const isCurrentStateInRange =
    currentAngle !== undefined &&
    currentAcceleration !== undefined &&
    currentAngle >= -40 &&
    currentAngle <= 40 &&
    currentAcceleration >= -5 &&
    currentAcceleration <= 5;

  return (
    <div className="relative">
      {/* 圆形图表容器 */}
      <div
        className="rounded-full overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center"
        style={{ width: "200px", height: "200px", margin: "0 auto" }}
      >
        <CardContent className="p-0 w-full h-full">
          <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%" aspect={1}>
              <ComposedChart className="pr-9 pt-3">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="angle"
                  name="角度"
                  domain={[-40, 40]}
                  tick={{ fontSize: 8 }}
                />
                <YAxis
                  type="number"
                  dataKey="acceleration"
                  name="加速度"
                  domain={[-5, 5]}
                  tick={{ fontSize: 8 }}
                />

                {!hasData && <NoDataDisplay />}

                {/* 渲染所有距离的轮廓线：0.2m, 0.5m, 1m, 2m, 5m */}
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

      {/* 图例 */}
      <div className="absolute top-0 left-0 bg-black/70 text-white rounded p-1 text-xs">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded"
              style={{ backgroundColor: "#b91c1c" }}
            ></div>
            <span>0.2m</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded"
              style={{ backgroundColor: "#f43f5e" }}
            ></div>
            <span>0.5m</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded"
              style={{ backgroundColor: "#ea580c" }}
            ></div>
            <span>1m</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded"
              style={{ backgroundColor: "#84cc16" }}
            ></div>
            <span>2m</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded"
              style={{ backgroundColor: "#22c55e" }}
            ></div>
            <span>5m</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyChart;
