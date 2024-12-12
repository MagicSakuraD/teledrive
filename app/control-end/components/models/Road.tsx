import React, { useMemo } from "react";
import { Extrude, Line } from "@react-three/drei";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";

interface RoadProps {
  centralLines: { x: number; y: number; z: number }[]; // 中心线点坐标
  roadWidth: number; // 道路的宽度
}

const Road: React.FC<RoadProps> = ({ centralLines, roadWidth }) => {
  const geometry = useMemo(() => {
    const vertices = [];
    const indices = [];

    for (let i = 0; i < centralLines.length - 1; i++) {
      const current = centralLines[i];
      const next = centralLines[i + 1];

      // 计算方向向量
      const direction = new THREE.Vector3(
        next.x - current.x,
        next.y - current.y,
        next.z - current.z
      ).normalize();

      // 计算垂直于方向的向量
      const side = new THREE.Vector3(-direction.z, 0, direction.x).normalize();

      // 创建四个顶点
      const v1 = new THREE.Vector3(
        current.x + (side.x * roadWidth) / 2,
        current.y,
        current.z + (side.z * roadWidth) / 2
      );
      const v2 = new THREE.Vector3(
        current.x - (side.x * roadWidth) / 2,
        current.y,
        current.z - (side.z * roadWidth) / 2
      );
      const v3 = new THREE.Vector3(
        next.x + (side.x * roadWidth) / 2,
        next.y,
        next.z + (side.z * roadWidth) / 2
      );
      const v4 = new THREE.Vector3(
        next.x - (side.x * roadWidth) / 2,
        next.y,
        next.z - (side.z * roadWidth) / 2
      );

      const baseIndex = i * 4;
      vertices.push(
        v1.x,
        v1.y,
        v1.z,
        v2.x,
        v2.y,
        v2.z,
        v3.x,
        v3.y,
        v3.z,
        v4.x,
        v4.y,
        v4.z
      );

      indices.push(
        baseIndex,
        baseIndex + 1,
        baseIndex + 2,
        baseIndex + 1,
        baseIndex + 3,
        baseIndex + 2
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }, [centralLines, roadWidth]);

  return (
    <mesh geometry={geometry} position={[0, -0.2, 0]}>
      <meshStandardMaterial color="#d6d3d1" side={THREE.DoubleSide} />
    </mesh>
  );
};

export default Road;
