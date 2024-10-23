"use client";
import React, { useMemo } from "react";
import { Line } from "@react-three/drei";
import { trajType } from "@/app/control-end/components/Car3D";

interface PathBoundaryProps {
  boundary: trajType[];
  localization?: {
    // 添加车辆位置信息
    position: {
      x: number;
      y: number;
      z: number;
    };
  };
}

const PathBoundary = ({ boundary, localization }: PathBoundaryProps) => {
  const { leftPoints, rightPoints } = useMemo(() => {
    const left: [number, number, number][] = [];
    const right: [number, number, number][] = [];

    boundary.forEach((point) => {
      // 相对于车辆位置的偏移计算
      const offsetX = localization
        ? point.position.x - localization.position.x
        : point.position.x;
      const offsetY = localization
        ? point.position.y - localization.position.y + 0.5
        : point.position.y;
      const offsetZ = localization
        ? point.position.z - localization.position.z
        : point.position.z;

      const position: [number, number, number] = [offsetX, offsetY, offsetZ];

      if (point.color && point.color.g === 1 && point.color.b === 1) {
        left.push(position);
      } else if (point.color && point.color.r === 1 && point.color.g === 1) {
        right.push(position);
      }
    });

    console.log("Left points count:", left.length);
    console.log("Right points count:", right.length);

    return {
      leftPoints: left,
      rightPoints: right,
    };
  }, [boundary, localization]);

  // 如果没有点，不渲染任何内容
  if (leftPoints.length === 0 && rightPoints.length === 0) {
    return null;
  }

  return (
    <>
      {leftPoints.length > 0 && (
        <Line points={leftPoints} color="#f8fafc" lineWidth={5} />
      )}
      {rightPoints.length > 0 && (
        <Line points={rightPoints} color="#f8fafc" lineWidth={5} />
      )}
    </>
  );
};

export default PathBoundary;
