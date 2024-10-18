"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, PositionMesh } from "@react-three/drei";
import { Model } from "./models/Model";
import { Line } from "@react-three/drei";
import { ModelSuv } from "./models/suv";
import { ModelCar } from "./models/car";
import { carMarker, Marker } from "@/lib/simplifyMarkers";

type obstacleType = {
  type: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
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

const TrajectoryLine = ({ trajectory }: { trajectory: trajType[] }) => {
  const points = useMemo(() => {
    // Provide a default empty array in case trajectory is null or undefined
    return (trajectory || []).map(
      (marker) =>
        new THREE.Vector3(
          marker.position.x,
          marker.position.y,
          marker.position.z
        )
    );
  }, [trajectory]);

  const colors = useMemo(() => {
    const startColor = new THREE.Color("#22c55e"); // Solid blue color
    const colorArray: Array<[number, number, number, number]> = []; // Array of color tuples
    const numPoints = trajectory.length;

    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1); // Interpolation value between 0 and 1
      const interpolatedColor = startColor.clone();
      colorArray.push([
        interpolatedColor.r,
        interpolatedColor.g,
        interpolatedColor.b,
        1 - t, // Fade to transparent
      ]);
    }
    return colorArray; // Return an array of [r, g, b, a] tuples
  }, [trajectory]);

  return (
    <Line
      points={points}
      color="#22c55e" // Base color
      lineWidth={20} // Thicker line
      vertexColors={colors} // Gradient color array as tuples
    />
  );
};

const Car3D: React.FC<Car3DProps> = ({
  localization,
  obstacles,
  trajectory,
}) => {
  // Ensure obstacles is an array before mapping
  const car_obstacles: obstacleType[] = Array.isArray(obstacles)
    ? obstacles.filter((obstacle: obstacleType) => obstacle.type === 9)
    : [];

  return (
    <Canvas>
      <OrbitControls />
      {/* 环境光 */}
      <ambientLight intensity={0.5} />
      {/* 平行光 */}
      <directionalLight color="#f8fafc" position={[5, 60, 7]} intensity={1} />
      <ModelSuv
        position={[
          localization.position.x,
          localization.position.y,
          localization.position.z,
        ]}
        quaternion={[
          localization.orientation.x,
          localization.orientation.y,
          localization.orientation.z,
          localization.orientation.w,
        ]}
        scale={[1, 1, 1]}
      />
      {car_obstacles.map(
        (obstacle: obstacleType, index: number) =>
          obstacle && (
            <ModelSuv
              key={index}
              position={[obstacle.position.x, 0, obstacle.position.y]}
              quaternion={[0, 0, 0, 0]}
              scale={[1, 1, 1]}
            />
          )
      )}

      <TrajectoryLine trajectory={trajectory} />

      <gridHelper args={[1000, 20]} />
      <axesHelper args={[200]} />
    </Canvas>
  );
};

export default Car3D;
