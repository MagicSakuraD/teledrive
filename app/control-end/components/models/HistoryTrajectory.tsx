import React, { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { pointMarker } from "@/lib/simplifyMarkers";

interface HistoryTrajectoryProps {
  predictedPoints: pointMarker[];
  localization: pointMarker;
  color?: string;
  lineWidth?: number;
  maxPoints?: number;
}

const HistoryTrajectory: React.FC<HistoryTrajectoryProps> = ({
  predictedPoints,
  localization,
  color = "#c084fc",
  lineWidth = 5,
  maxPoints = 300,
}) => {
  // 将 predictedPoints 转换为相对于车辆位置的轨迹点
  const trajectoryPoints = useMemo(() => {
    if (
      !predictedPoints ||
      !Array.isArray(predictedPoints) ||
      predictedPoints.length < 2
    ) {
      return [];
    }

    // 如果点超过最大限制，进行采样
    const points =
      predictedPoints.length > maxPoints
        ? predictedPoints.filter(
            (_, i) => i % Math.ceil(predictedPoints.length / maxPoints) === 0
          )
        : predictedPoints;

    // 将每个预测点转换为相对于当前车辆位置的 THREE.Vector3
    return points
      .map((point) => {
        if (!point.position) return null;

        return new THREE.Vector3(
          point.position.x - localization.position.x,
          point.position.y - localization.position.y + 0.1, // 稍微抬高一点，避免与地面贴合
          point.position.z - localization.position.z
        );
      })
      .filter(Boolean) as THREE.Vector3[];
  }, [predictedPoints, localization.position, maxPoints]);

  // 如果点不足以形成线，则不渲染
  if (trajectoryPoints.length < 2) return null;

  return <Line points={trajectoryPoints} color={color} lineWidth={lineWidth} />;
};

export default HistoryTrajectory;
