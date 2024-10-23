import * as THREE from "three";

export type orientationType = {
  x: number;
  y: number;
  z: number;
  w: number;
};

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

export default computeFinalQuaternion;
