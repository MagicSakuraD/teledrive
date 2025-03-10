"use client";
import React, { useMemo } from "react";
import {
  ComposedChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ZAxis,
  Tooltip,
  Legend,
  Cell,
  Text,
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

// Color mapping for specific distance values
const getPointColor = (distance: number) => {
  // 更精细的距离颜色映射
  if (distance <= 0.2) return "#800000"; // 深红色 - 极度危险
  if (distance <= 0.5) return "#A00000"; // 暗红色 - 高度危险
  if (distance <= 1.0) return "#C00000"; // 亮红色 - 非常危险
  if (distance <= 1.5) return "#E00000"; // 鲜红色 - 危险
  if (distance <= 2.0) return "#FF0000"; // 红色 - 很近
  if (distance <= 5.0) return "#FF4500"; // 橙红色 - 较近
  if (distance <= 8.0) return "#FF8C00"; // 深橙色 - 近
  if (distance <= 12.0) return "#FFD700"; // 金色 - 中等距离
  if (distance <= 16.0) return "#ADFF2F"; // 黄绿色 - 较远
  if (distance <= 20.0) return "#32CD32"; // 酸橙绿 - 远
  if (distance <= 25.0) return "#00FA9A"; // 中春绿色 - 很远
  return "#00FF7F"; // 春绿色 - 极远
};

const NoDataDisplay = () => {
  return (
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
};

const SafetyChart: React.FC<SafetyChartProps> = ({
  safetyData,
  title = "安全轮廓可视化",
  description = "角度与加速度关系图（颜色表示距离）",
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
          distance: safetyData[i + 2], // 预测距离（用于点的颜色）
        });
      }
    }

    return data;
  }, [safetyData]);

  // 按距离分组的数据（用于连线）
  const groupedByDistance = useMemo(() => {
    if (!chartData.length) return [];

    // 创建距离映射表
    const distanceMap = new Map();

    // 对每个数据点，按距离分组
    chartData.forEach((point) => {
      // 对距离值取整到小数点后一位，作为分组键
      const distKey = Math.round(point.distance * 10) / 10;
      if (!distanceMap.has(distKey)) {
        distanceMap.set(distKey, []);
      }
      distanceMap.get(distKey).push(point);
    });

    interface DataPoint {
      angle: number;
      acceleration: number;
      distance: number;
    }

    interface DistanceGroup {
      distance: number;
      points: DataPoint[];
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

  const minDist = useMemo(
    () =>
      chartData.length > 0 ? Math.min(...chartData.map((d) => d.distance)) : 0,
    [chartData]
  );

  const maxDist = useMemo(
    () =>
      chartData.length > 0 ? Math.max(...chartData.map((d) => d.distance)) : 0,
    [chartData]
  );

  const hasData = chartData.length > 0;

  // 扩展的距离参考值
  const distanceValues = [0.2, 0.5, 1.0, 1.5, 2.0, 5, 8, 12, 16, 20, 25, 30];

  // 当前控制状态是否在图表范围内
  const isCurrentStateInRange =
    currentAngle !== undefined &&
    currentAcceleration !== undefined &&
    currentAngle >= -40 &&
    currentAngle <= 40 &&
    currentAcceleration >= -5 &&
    currentAcceleration <= 5;

  return (
    <Card className="overflow-hidden grow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              margin={{
                left: 20,
                right: 20,
                top: 20,
                bottom: 30,
              }}
            >
              <CartesianGrid
                vertical={true}
                horizontal={true}
                strokeDasharray="3 3"
              />
              <XAxis
                type="number"
                dataKey="angle"
                name="角度"
                domain={[-40, 40]}
                label={{
                  value: "方向（度）",
                  position: "bottom",
                  offset: 15,
                }}
              />
              <YAxis
                type="number"
                dataKey="acceleration"
                name="加速度"
                domain={[-5, 5]}
                label={{
                  value: "加速度",
                  angle: -90,
                  position: "insideLeft",
                  offset: -5,
                }}
              />
              {hasData && (
                <ZAxis
                  type="number"
                  dataKey="distance"
                  range={[20, 200]}
                  name="距离"
                />
              )}

              {hasData && (
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value, name) => {
                    if (name === "distance") return [`${value}米`, "距离"];
                    if (name === "acceleration") return [`${value}`, "加速度"];
                    if (name === "angle") return [`${value}°`, "角度"];
                    return [value, name];
                  }}
                  labelFormatter={(label) => ""}
                  contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
                />
              )}

              {!hasData && <NoDataDisplay />}

              {/* 先渲染相同距离的连线 */}
              {hasData &&
                groupedByDistance.map((group, idx) => {
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
                        dot={false}
                        strokeWidth={1.5}
                        name={`距离: ${group.distance}米`}
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
                  r={6}
                  fill="#FFFFFF"
                  stroke="#000000"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
          {distanceValues.map((dist, index) => (
            <div key={index} className="flex items-center mr-2">
              <div
                className="text-center h-3 w-3 rounded-full mr-1"
                style={{ backgroundColor: getPointColor(dist) }}
              />
              {dist}米
            </div>
          ))}
        </div>

        {/* 当前加速度，角度：{currentAcceleration}，{currentAngle} */}
        <div>
          {isCurrentStateInRange ? (
            <div className="text-sm text-muted-foreground">
              当前控制状态：{currentAcceleration.toFixed(2)} m/s²，{" "}
              {currentAngle.toFixed(2)}°
            </div>
          ) : (
            currentAcceleration &&
            currentAngle && (
              <div className="text-sm text-muted-foreground">
                特殊：当前控制状态：{currentAcceleration.toFixed(2)} m/s²，{" "}
                {currentAngle.toFixed(2)}°
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyChart;
