import React, { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { trajType } from "@/app/control-end/components/Car3D";
import { pointMarker } from "@/lib/simplifyMarkers";

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
            marker.position.y - localization.position.y + 0.1,
            marker.position.z - localization.position.z
          )
      );
    }, [trajectory, localization.position]);

    const colors = useMemo(() => {
      const startColor = new THREE.Color("#2563eb");
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

export default TrajectoryLine;
