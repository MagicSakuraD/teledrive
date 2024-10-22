"use client";
import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, PerspectiveCamera, Line } from "@react-three/drei";
import { ModelSuv } from "./models/suv";
import { carMarker } from "@/lib/simplifyMarkers";

type obstacleType = {
  type: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  orientation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
};

type trajType = {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
};

interface Car3DProps {
  localization: carMarker;
  obstacles: obstacleType[];
  trajectory: trajType[];
}

const TrajectoryLine = React.memo(
  ({
    trajectory,
    localization,
  }: {
    trajectory: trajType[];
    localization: carMarker;
  }) => {
    const points = useMemo(() => {
      return trajectory.map(
        (marker) =>
          new THREE.Vector3(
            marker.position.x - localization.position.x,
            marker.position.y - localization.position.y,
            marker.position.z - localization.position.z
          )
      );
    }, [trajectory, localization.position]);

    const colors = useMemo(() => {
      const startColor = new THREE.Color("#22c55e");
      const numPoints = trajectory.length;
      const colorArray = [];
      for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);
        colorArray.push([startColor.r, startColor.g, startColor.b, 1 - t] as [
          number,
          number,
          number,
          number
        ]);
      }
      return colorArray;
    }, [trajectory.length]);

    return (
      <Line
        points={points}
        color="#22c55e"
        lineWidth={20}
        vertexColors={colors}
        transparent
      />
    );
  }
);

TrajectoryLine.displayName = "TrajectoryLine";

const Car3D: React.FC<Car3DProps> = ({
  localization,
  obstacles,
  trajectory,
}) => {
  const car_obstacles: obstacleType[] = Array.isArray(obstacles)
    ? obstacles.filter((obstacle: obstacleType) => obstacle.type === 9)
    : [];

  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[10, 20, -6]} />
      <OrbitControls target={[0, 0, 0]} />

      <ambientLight intensity={0.5} />
      <directionalLight color="#f8fafc" position={[5, 60, 7]} intensity={1} />

      {/* 车辆固定在原点 */}
      <ModelSuv
        position={[0, 0, 0]} // 车辆位置为原点
        rotation={[
          0,
          Math.asin(
            2 *
              (localization.orientation.w * localization.orientation.y -
                localization.orientation.z * localization.orientation.x)
          ) -
            Math.PI / 2,
          0,
        ]}
        scale={[1, 1, 1]}
      />

      {/* 障碍物相对于车辆的相对位置 */}
      {car_obstacles.map(
        (obstacle: obstacleType, index: number) =>
          obstacle && (
            <ModelSuv
              key={index}
              position={[
                obstacle.position.x - localization.position.x,
                obstacle.position.y - localization.position.y,
                obstacle.position.z - localization.position.z,
              ]}
              quaternion={[
                obstacle.orientation.x,
                obstacle.orientation.y,
                obstacle.orientation.z,
                obstacle.orientation.w,
              ]}
              scale={[1, 1, 1]}
            />
          )
      )}

      {/* 显示轨迹，轨迹点也减去车辆位置 */}
      {trajectory && trajectory.length > 0 && (
        <TrajectoryLine trajectory={trajectory} localization={localization} />
      )}

      {/* <gridHelper args={[60, 6]} /> */}
      {/* <axesHelper args={[200]} /> */}
    </Canvas>
  );
};

export default Car3D;
