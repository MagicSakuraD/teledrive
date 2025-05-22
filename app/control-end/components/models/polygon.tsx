"use client";
import React, { useMemo } from "react";
import { Shape } from "@react-three/drei";
import { Marker } from "@/lib/simplifyMarkers";
import * as THREE from "three";
import { ExtrudeGeometry } from "three";

interface PolygonProps {
  markers: Marker[];
  localization?: {
    position: {
      x: number;
      y: number;
      z: number;
    };
  };
}

const Polygon: React.FC<PolygonProps> = ({ markers, localization }) => {
  const shapes = useMemo(() => {
    return markers
      .map((marker, index) => {
        const points = marker.points?.map((point) => {
          const x = point.x - (localization?.position.x || 0);
          const z = point.z - (localization?.position.z || 0);

          return new THREE.Vector2(x, z); // 使用x和z坐标创建2D平面
        });

        if (points && points.length > 0) {
          const shape = new THREE.Shape();

          // 移动到第一个点
          shape.moveTo(points[0].x, points[0].y);

          // 连接其余的点
          for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].y);
          }

          // 闭合形状
          shape.lineTo(points[0].x, points[0].y);

          // 创建拉伸几何体
          const extrudeSettings = {
            depth: -1.5, // y轴高度为2
            bevelEnabled: false, // 禁用斜角
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

          // 旋转几何体使其垂直于地面
          geometry.rotateX(-Math.PI / 2 + 2 * Math.PI); // 绕x轴旋转-90度
          // 绕y轴旋转所需的角度（例如45度）
          geometry.rotateY(-Math.PI / 2 - Math.PI / 2); // 绕y轴旋转45度

          geometry.rotateZ(-Math.PI);

          return (
            <mesh key={index} geometry={geometry}>
              <meshBasicMaterial
                color={
                  new THREE.Color(
                    marker.color?.r || 1,
                    marker.color?.g || 0,
                    marker.color?.b || 0
                  )
                }
                side={THREE.DoubleSide}
                transparent={true}
                opacity={0.5}
              />
            </mesh>
          );
        }
        return null;
      })
      .filter(Boolean);
  }, [markers, localization]);

  // 如果没有有效的形状，不渲染任何内容
  if (shapes.length === 0) {
    console.log("No shapes to render");
    return null;
  }

  return <>{shapes}</>;
};

export default Polygon;
