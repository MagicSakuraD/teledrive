"use client";
import React, { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { pointMarker } from "@/lib/simplifyMarkers";

interface SafetyContourOutlineProps {
  safetyData: number[];
  localization: pointMarker;
  maxDistance?: number;
  lineWidth?: number;
}

const SafetyContourOutline: React.FC<SafetyContourOutlineProps> = ({
  safetyData,
  localization,
  maxDistance = 15,
  lineWidth = 1,
}) => {
  // 处理原始数据为三元组
  const processedData = useMemo(() => {
    if (!safetyData || safetyData.length === 0) return [];

    const triplets = [];
    for (let i = 0; i < safetyData.length; i += 3) {
      if (i + 2 < safetyData.length) {
        triplets.push({
          angle: safetyData[i],
          acceleration: safetyData[i + 1],
          distance: safetyData[i + 2],
        });
      }
    }
    return triplets;
  }, [safetyData]);

  // 创建轮廓线点
  const points = useMemo(() => {
    if (processedData.length === 0) {
      return [];
    }

    // 对角度排序
    const sortedData = [...processedData].sort((a, b) => a.angle - b.angle);

    // 创建轮廓线点
    return sortedData.map((point) => {
      const x = Math.cos(point.angle) * Math.min(point.distance, maxDistance);
      const z = Math.sin(point.angle) * Math.min(point.distance, maxDistance);
      return new THREE.Vector3(x, 0.1, z);
    });
  }, [processedData, maxDistance]);

  // 如果没有数据，不渲染
  if (points.length === 0) {
    return null;
  }

  // 添加起点以闭合轮廓
  const closedPoints = [...points];
  if (points.length > 0) {
    closedPoints.push(points[0]); // 添加第一个点以闭合线段
  }

  return (
    <Line
      points={closedPoints}
      color="#ffffff"
      lineWidth={lineWidth}
      transparent
      opacity={0.8}
    />
  );
};

export default SafetyContourOutline;
