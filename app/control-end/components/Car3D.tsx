"use client";
import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, PerspectiveCamera, Text3D } from "@react-three/drei";
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
import { ConeModel } from "./models/cone";
import { Marker } from "@/lib/simplifyMarkers";
import { WalkModel } from "./models/walk";
import { ArrowModel } from "./models/arrow";

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
  obstacles: Marker[];
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
  console.log("obstacles", obstacles);
  const textObstacles: Marker[] = Array.isArray(obstacles)
    ? obstacles.filter((obstacle: Marker) => obstacle.type === 9)
    : [];

  const arrowObstacles: Marker[] = Array.isArray(obstacles)
    ? obstacles.filter((obstacle: Marker) => obstacle.type === 0)
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
      {/* <PerspectiveCamera makeDefault position={[0, 20, -4]} />
      <OrbitControls target={[0, 0, 0]} /> */}
      <FollowCamera quaternion={finalQuaternion} />
      <ambientLight intensity={0.5} />
      <directionalLight color="#eff6ff" position={[5, 60, 7]} intensity={1.5} />
      {/* <EffectComposer>
       
        <BrightnessContrast brightness={0.03} contrast={0.2} />
        <HueSaturation hue={0.0} saturation={0.3} />
      </EffectComposer> */}

      <ModelSuv
        position={[0, 0, 0]} // 车辆位置为原点
        quaternion={finalQuaternion}
        scale={[1, 1, 1]}
      />

      <Text3D
        font="./MiSans Normal_Regular.json"
        position={[0, 5, 0]}
        rotation={[Math.PI * 0.5, Math.PI, 0]}
        size={1} // 控制字体大小
        height={0.2} // 控制文字厚度
        bevelEnabled // 添加斜角效果
        bevelSize={0.05} // 斜角大小
        smooth={1} // 平滑程度
      >
        car
      </Text3D>

      {textObstacles.map(
        (obstacle: Marker, index: number) =>
          obstacle && (
            // <CarModel
            //   key={index}
            //   position={[
            //     obstacle.position.x - localization.position.x,
            //     obstacle.position.y - localization.position.y - 2,
            //     obstacle.position.z - localization.position.z,
            //   ]}
            //   quaternion={computeFinalQuaternion(obstacle.orientation)}
            //   scale={[1, 1, 1]}
            // />
            <Text3D
              key={index}
              font="./MiSans Normal_Regular.json"
              position={
                obstacle.pose
                  ? [
                      obstacle.pose.position.x - localization.position.x,
                      obstacle.pose.position.y - localization.position.y,
                      obstacle.pose.position.z - localization.position.z,
                    ]
                  : [0, 0, 0]
              }
              rotation={[Math.PI * 0.5, Math.PI, 0]}
              size={1} // 控制字体大小
              height={0.2} // 控制文字厚度
              letterSpacing={0.8} // 控制字间距
              bevelEnabled // 添加斜角效果
              bevelSize={0.05} // 斜角大小
            >
              {obstacle.text}
            </Text3D>
          )
      )}

      {/* // 显示箭头 */}
      {arrowObstacles.map((obstacle: Marker, index: number) => (
        <ArrowModel
          key={index}
          position={[
            obstacle.pose.position.x - localization.position.x,
            obstacle.pose.position.y - localization.position.y,
            obstacle.pose.position.z - localization.position.z,
          ]}
          quaternion={computeFinalQuaternion(obstacle.pose.orientation)}
          scale={[1, 1, 1]}
        />
      ))}

      {/* 显示行人 */}

      {/* 使用 PathBoundary 组件 */}
      {boundary && (
        <PathBoundary boundary={boundary} localization={localization} />
      )}

      {centralLines && <RoadScene centralLines={Rodeline} />}

      {/* 显示轨迹，轨迹点也减去车辆位置 */}
      {/* {trajectory && trajectory.length > 0 && (
        <TrajectoryLine trajectory={trajectory} localization={localization} />
      )} */}

      {/* <gridHelper args={[60, 6]} /> */}
      {/* <axesHelper args={[200]} /> */}
    </Canvas>
  );
};

export default Car3D;
