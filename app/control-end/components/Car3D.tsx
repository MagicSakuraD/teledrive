"use client";
import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, PerspectiveCamera, Line } from "@react-three/drei";
import { ModelSuv } from "./models/suv";
import { pointMarker } from "@/lib/simplifyMarkers";
import RoadScene from "./Road";

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

type orientationType = {
  x: number;
  y: number;
  z: number;
  w: number;
};

interface Car3DProps {
  localization: pointMarker;
  obstacles: obstacleType[];
  trajectory: trajType[];
  centralLines: trajType[];
}

const TrajectoryLine = React.memo(
  ({
    trajectory,
    localization,
  }: {
    trajectory: trajType[];
    localization: pointMarker;
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
        // color="#22c55e"
        lineWidth={20}
        vertexColors={colors}
        transparent
      />
    );
  }
);

TrajectoryLine.displayName = "TrajectoryLine";

const computeFinalQuaternion = (localization: orientationType) => {
  const baseQuaternion = new THREE.Quaternion(
    localization.x,
    localization.y,
    localization.z,
    localization.w
  );

  const additionalRotation = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    -Math.PI / 2
  );

  return baseQuaternion.multiply(additionalRotation);
};

const Car3D: React.FC<Car3DProps> = ({
  localization,
  obstacles,
  trajectory,
  centralLines,
}) => {
  const car_obstacles: obstacleType[] = Array.isArray(obstacles)
    ? obstacles.filter((obstacle: obstacleType) => obstacle.type === 9)
    : [];

  const finalQuaternion = computeFinalQuaternion(localization.orientation);
  console.log(centralLines, "😯");
  console.log(localization, "🤔");
  //中心线减去车辆位置
  const Rodeline = centralLines
    ? centralLines.map(
        (p) =>
          new THREE.Vector3(
            p.position.x - localization.position.x,
            p.position.y - localization.position.y,
            p.position.z - localization.position.z
          )
      )
    : [];

  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[10, 20, -6]} />
      <OrbitControls target={[0, 0, 0]} />

      <ambientLight intensity={0.5} />
      <directionalLight color="#f8fafc" position={[5, 60, 7]} intensity={1} />

      <ModelSuv
        position={[0, 0, 0]} // 车辆位置为原点
        quaternion={finalQuaternion}
        scale={[1, 1, 1]}
      />

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
              quaternion={computeFinalQuaternion(obstacle.orientation)}
              scale={[1, 1, 1]}
            />
          )
      )}

      {/* {centralLines && <RoadScene centralLines={Rodeline} />} */}

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
