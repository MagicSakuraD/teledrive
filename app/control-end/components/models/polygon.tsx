"use client";
import React, { useMemo, useEffect, useRef } from "react";
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
  // 用ref存储创建的几何体和材质，以便清理
  const geometriesRef = useRef<THREE.ExtrudeGeometry[]>([]);
  const materialsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const shapes = useMemo(() => {
    // 清理之前创建的资源
    geometriesRef.current.forEach((geometry) => {
      geometry.dispose();
    });
    materialsRef.current.forEach((material) => {
      material.dispose();
    });
    geometriesRef.current = [];
    materialsRef.current = [];
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
          geometry.rotateX(-Math.PI / 2); // 绕x轴旋转-90度
          geometry.rotateY(-Math.PI); // 绕y轴旋转180度
          geometry.rotateZ(-Math.PI); // 绕z轴旋转180度

          // 创建材质
          const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(
              marker.color?.r || 1,
              marker.color?.g || 0,
              marker.color?.b || 0
            ),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5,
          });

          // 存储到ref中以便后续清理
          geometriesRef.current.push(geometry);
          materialsRef.current.push(material);

          return <mesh key={index} geometry={geometry} material={material} />;
        }
        return null;
      })
      .filter(Boolean);
  }, [markers, localization]);

  // 组件卸载时清理所有资源
  useEffect(() => {
    return () => {
      geometriesRef.current.forEach((geometry) => {
        geometry.dispose();
      });
      materialsRef.current.forEach((material) => {
        material.dispose();
      });
      geometriesRef.current = [];
      materialsRef.current = [];
    };
  }, []);

  // 如果没有有效的形状，不渲染任何内容
  if (shapes.length === 0) {
    console.log("No shapes to render");
    return null;
  }

  return <>{shapes}</>;
};

export default Polygon;
