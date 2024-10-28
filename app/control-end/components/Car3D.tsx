"use client";
import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, PerspectiveCamera, Line } from "@react-three/drei";
import { ModelSuv } from "./models/suv";
import { pointMarker } from "@/lib/simplifyMarkers";
import RoadScene from "./models/Road";
import computeFinalQuaternion from "./utils3D/computeFinalQuaternion";
import TrajectoryLine from "./models/Trajectory"; // 导入 TrajectoryLine
import PathBoundary from "./models/PathBoundary"; // 导入 PathBoundary
import {
  EffectComposer,
  HueSaturation,
  BrightnessContrast,
} from "@react-three/postprocessing";
import FollowCamera from "./models/FollowCamera";
import { CarModel } from "./models/car";
import { ConeModel } from "./models/cone";
import { WalkModel } from "./models/walk";

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

export type trajType = {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  color?: { r: number; g: number; b: number; a: number };
};

interface Car3DProps {
  localization: pointMarker;
  obstacles: obstacleType[];
  trajectory: trajType[];
  centralLines: trajType[];
  boundary: trajType[];
}

const Car3D: React.FC<Car3DProps> = ({
  localization,
  obstacles,
  trajectory,
  centralLines,
  boundary,
}) => {
  const car_obstacles: obstacleType[] = Array.isArray(obstacles)
    ? obstacles.filter((obstacle: obstacleType) => obstacle.type === 9)
    : [];

  const pedestrian_obstacles: obstacleType[] = Array.isArray(obstacles)
    ? obstacles.filter((obstacle: obstacleType) => obstacle.type === 1)
    : [];

  const cone_obstacles: obstacleType[] = Array.isArray(obstacles)
    ? obstacles.filter((obstacle: obstacleType) => obstacle.type === 2)
    : [];

  const finalQuaternion = computeFinalQuaternion(localization.orientation);

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
      {/* <PerspectiveCamera makeDefault position={[10, 20, -6]} />
      <OrbitControls target={[0, 0, 0]} /> */}
      <FollowCamera quaternion={finalQuaternion} />
      <ambientLight intensity={0.5} />
      <directionalLight color="#eff6ff" position={[5, 60, 7]} intensity={1.5} />
      <EffectComposer>
        {/* <Bloom intensity={1.2} luminanceThreshold={0.3} /> */}
        <BrightnessContrast brightness={0.05} contrast={0.2} />
        <HueSaturation hue={0.0} saturation={0.3} />
      </EffectComposer>

      <ModelSuv
        position={[0, 0, 0]} // 车辆位置为原点
        quaternion={finalQuaternion}
        scale={[1, 1, 1]}
      />

      {car_obstacles.map(
        (obstacle: obstacleType, index: number) =>
          obstacle && (
            <CarModel
              key={index}
              position={[
                obstacle.position.x - localization.position.x,
                obstacle.position.y - localization.position.y - 2,
                obstacle.position.z - localization.position.z,
              ]}
              quaternion={computeFinalQuaternion(obstacle.orientation)}
              scale={[1, 1, 1]}
            />
          )
      )}
      {/* cone障碍物 */}
      {cone_obstacles.map(
        (obstacle: obstacleType, index: number) =>
          obstacle && (
            <ConeModel
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

      {/* pedestrian障碍物 */}
      {pedestrian_obstacles.map(
        (obstacle: obstacleType, index: number) =>
          obstacle && (
            <WalkModel
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

      {/* 使用 PathBoundary 组件 */}
      {boundary && (
        <PathBoundary boundary={boundary} localization={localization} />
      )}

      {centralLines && <RoadScene centralLines={Rodeline} />}

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
