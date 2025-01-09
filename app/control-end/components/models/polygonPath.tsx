"use client";
import React, { useMemo } from "react";
import { Line } from "@react-three/drei";

export type polygonPathType = {
  id: string;
  points: { x: number; y: number; z: number }[]; // 每个points数组包含两个坐标元素
  color?: { r: number; g: number; b: number; a: number }; // 可选颜色
};

interface PolygonPathProps {
  paths: polygonPathType[]; // 传入的路径数组
  localization?: {
    position: {
      x: number;
      y: number;
      z: number;
    };
  };
}

const PolygonPath: React.FC<PolygonPathProps> = ({ paths, localization }) => {
  const lineSegments = useMemo(() => {
    return paths.map((path, index) => {
      // 检查points数组是否有两个元素
      if (path.points.length !== 2) {
        console.warn(`Path ${path.id} does not have exactly two points.`);
        return null;
      }

      // 计算局部坐标
      const points = path.points.map((point) => [
        point.x - (localization?.position.x || 0),
        point.y - (localization?.position.y || 0),
        point.z - (localization?.position.z || 0),
      ]);

      // 获取颜色和透明度
      const color = path.color
        ? `rgba(${path.color.r * 255}, ${path.color.g * 255}, ${
            path.color.b * 255
          }, ${path.color.a || 1})`
        : "white"; // 默认白色

      return (
        <Line
          key={index}
          points={points as [number, number, number][]} // 点数组
          color={color}
          lineWidth={1} // 线宽，单位为像素
          transparent={true}
        />
      );
    });
  }, [paths, localization]);

  // 如果没有有效的路径，不渲染任何内容
  if (lineSegments.length === 0) {
    console.log("No lines to render");
    return null;
  }

  return <>{lineSegments}</>;
};

export default PolygonPath;
