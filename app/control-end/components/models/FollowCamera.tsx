import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// 创建跟随相机组件
const FollowCamera = ({ quaternion }: { quaternion: THREE.Quaternion }) => {
  const { camera } = useThree();
  const cameraOffset = useRef(new THREE.Vector3(0, 20, -4)); // 相机相对车辆的偏移量
  const targetOffset = useRef(new THREE.Vector3(0, 0, 8)); // 相机看向的目标点偏移量

  useFrame(() => {
    // 计算相机位置
    const cameraPosition = cameraOffset.current.clone();
    cameraPosition.applyQuaternion(quaternion);

    // 计算目标位置
    const targetPosition = targetOffset.current.clone();
    targetPosition.applyQuaternion(quaternion);

    // 平滑过渡到新位置
    camera.position.lerp(cameraPosition, 0.01);

    // 让相机看向目标点
    const lookAtPosition = new THREE.Vector3().addVectors(
      new THREE.Vector3(0, 0, 0),
      targetPosition
    );
    camera.lookAt(lookAtPosition);
  });

  return null;
};

export default FollowCamera;
