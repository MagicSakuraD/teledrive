"use client";
import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Model } from "./models/Model";
import { Grid } from "@react-three/drei";

export default function Car3D() {
  return (
    <Canvas camera={{ near: 0.1, far: 10000, position: [0, 100, 500] }}>
      <OrbitControls />
      {/* 环境光 */}
      <ambientLight intensity={0.5} />
      {/* 平行光 */}
      <directionalLight color="#f8fafc" position={[5, 60, 7]} intensity={1} />
      {/* <Model position={[0, 40, 0]} scale={[0.5, 0.5, 0.5]} /> */}
      <gridHelper args={[1000, 20]} />
      <axesHelper args={[200]} />
    </Canvas>
  );
}
