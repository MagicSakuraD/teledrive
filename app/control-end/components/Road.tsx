import React, { useMemo } from "react";
import { Extrude, Line } from "@react-three/drei";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";

interface RoadProps {
  centralLines: { x: number; y: number; z: number }[]; // 中心线点坐标
  roadWidth: number; // 道路的宽度
}

const Road: React.FC<RoadProps> = ({ centralLines, roadWidth }) => {
  const roadShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -roadWidth / 2);
    shape.lineTo(0, roadWidth / 2);
    return shape;
  }, [roadWidth]);

  const extrudeSettings = useMemo(
    () => ({
      steps: centralLines.length,
      bevelEnabled: false,
      extrudePath: new THREE.CatmullRomCurve3(
        centralLines.map(
          (point) => new THREE.Vector3(point.x, point.y, point.z)
        )
      ),
    }),
    [centralLines]
  );

  return (
    <>
      {/* 道路表面 */}
      <Extrude args={[roadShape, extrudeSettings]}>
        <meshStandardMaterial color="gray" side={THREE.DoubleSide} />
      </Extrude>

      {/* 道路中心线 */}
      <Line
        points={centralLines.map((point) => [point.x, point.y, point.z])}
        color="white"
        lineWidth={2}
      />
    </>
  );
};

const RoadScene = ({
  centralLines,
}: {
  centralLines: { x: number; y: number; z: number }[];
}) => {
  return <Road centralLines={centralLines} roadWidth={5} />;
};

export default RoadScene;
