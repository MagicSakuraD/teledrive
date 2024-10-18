"use client";
import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Model } from "./models/Model";
import { Grid } from "@react-three/drei";
import { ModelSuv } from "./models/suv";
import { ModelCar } from "./models/car";
import { carMarker } from "@/lib/simplifyMarkers";

export default function Car3D(localization: carMarker) {
  return (
    <Canvas
      camera={{
        near: 0.1,
        far: 10000,
        position: [0, 100, 500],
      }}
    >
      <OrbitControls />
      {/* 环境光 */}
      <ambientLight intensity={0.5} />
      {/* 平行光 */}
      <directionalLight color="#f8fafc" position={[5, 60, 7]} intensity={1} />
      {/* <Model
        position={[
          localization.position.x,
          localization.position.y,
          localization.position.z,
        ]}
        // quaternion={[
        //   localization.orientation.x,
        //   localization.orientation.y,
        //   localization.orientation.z,
        //   localization.orientation.w,
        // ]}
        scale={[0.5, 0.5, 0.5]}
      /> */}

      {/* <ModelSuv position={[0, 0, 0]} scale={[20, 20, 20]} /> */}
      <ModelSuv
        position={[
          localization.position.x,
          localization.position.z,
          localization.position.y,
        ]}
        quaternion={[
          localization.orientation.x,
          localization.orientation.z,
          localization.orientation.y,
          localization.orientation.w,
        ]}
        scale={[5, 5, 5]}
      />
      {/* <ModelCar position={[0, 40, 0]} scale={[50, 50, 50]} /> */}

      <gridHelper args={[1000, 20]} />
      <axesHelper args={[200]} />
    </Canvas>
  );
}
