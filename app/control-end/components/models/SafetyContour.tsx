"use client";
import React, { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { pointMarker } from "@/lib/simplifyMarkers";

interface SafetyContourProps {
  safetyData: number[]; // 原始数据数组 [angle1, accel1, dist1, angle2, accel2, dist2, ...]
  localization: pointMarker;
  maxDistance?: number; // 最大可视化距离
}

const SafetyContour: React.FC<SafetyContourProps> = ({
  safetyData,
  localization,
  maxDistance = 15, // 默认最大可视化距离为15米
}) => {
  // 处理原始数据为三元组
  const processedData = useMemo(() => {
    if (!safetyData || safetyData.length === 0) return [];

    const triplets = [];
    for (let i = 0; i < safetyData.length; i += 3) {
      if (i + 2 < safetyData.length) {
        triplets.push({
          angle: safetyData[i], // 方向角度（弧度）
          acceleration: safetyData[i + 1], // 加速度
          distance: safetyData[i + 2], // 预测距离
        });
      }
    }
    return triplets;
  }, [safetyData]);

  // 创建预测距离的点集
  const points = useMemo(() => {
    if (processedData.length === 0) {
      return [];
    }

    // 对角度排序，确保点按照角度顺序连接
    const sortedData = [...processedData].sort((a, b) => a.angle - b.angle);

    // 创建预测距离轮廓线的点
    const contourPoints = sortedData.map((point) => {
      // 根据角度和距离计算x, z坐标（y为高度）
      const distance = Math.min(point.distance, maxDistance);
      const x = Math.cos(point.angle) * distance;
      const z = Math.sin(point.angle) * distance;

      return new THREE.Vector3(x, 0.1, z); // 稍微抬高一点以避免与地面重合
    });

    // 闭合轮廓线
    if (contourPoints.length > 0) {
      contourPoints.push(contourPoints[0]);
    }

    return contourPoints;
  }, [processedData, maxDistance]);

  // 如果没有数据，不渲染
  if (points.length === 0) {
    return null;
  }

  return (
    <Line
      points={points}
      color="#00ffff" // 使用青色作为安全轮廓线的颜色
      lineWidth={3} // 增加线宽使其更明显
      transparent
      opacity={0.8}
    />
  );
};

export default SafetyContour;
