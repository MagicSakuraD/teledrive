import * as THREE from "three";
import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    Object_3: THREE.Mesh;
  };
  materials: {
    car_jeep_ren: THREE.MeshBasicMaterial;
  };
};

export function ModelSuv(props: JSX.IntrinsicElements["group"]) {
  const { nodes, materials } = useGLTF("/suv2.glb") as GLTFResult;

  // Original model dimensions (assumed based on scale [0.959, 1.067, 0.876])
  const originalWidth = 1.86 / 0.959; // Approximate original width
  const originalLength = 4.515 / 1.067; // Approximate original length
  const originalHeight = 1.69 / 0.876; // Approximate original height

  // Desired dimensions
  const targetWidth = 1.86; // width
  const targetLength = 4.515; // length
  const targetHeight = 1.69; // height

  // Calculate scale factors
  const scaleX = targetWidth / originalWidth; // For width
  const scaleY = targetLength / originalLength; // For length (note: Y is length due to rotation)
  const scaleZ = targetHeight / originalHeight; // For height

  // Calculate position adjustment to place rear axle at origin
  // wheelbase is 2.65, rear_to_back is 0.96
  // Total length is 4.515
  // Distance from front of car to rear axle = 4.515 - 0.96 = 3.555
  // We want to move the model forward by this amount
  const rearAxleOffset = 3.555 / 2; // Divide by 2 because the origin is in the center

  return (
    <group {...props} dispose={null}>
      <group
        name="Scene"
        position={[0, 0, rearAxleOffset]} // Move model to place rear axle at origin
      >
        <mesh
          name="Object_3"
          castShadow
          receiveShadow
          geometry={nodes.Object_3.geometry}
          material={materials.car_jeep_ren}
          rotation={[-Math.PI / 2, 0, 0]} // This rotates the model to correct orientation
          scale={[scaleX, scaleY, scaleZ]} // Apply calculated scales
        />
      </group>
    </group>
  );
}

useGLTF.preload("/suv2.glb");
