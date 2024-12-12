import React, { useMemo, useState, useEffect } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { pointMarker } from "@/lib/simplifyMarkers";
import { Marker } from "@/lib/simplifyMarkers";

const Lane = React.memo(
  ({
    normalRoad,
    localization,
  }: {
    normalRoad: Marker;
    localization: pointMarker;
  }) => {
    const points = useMemo(() => {
      return normalRoad.points!.map(
        (point) =>
          new THREE.Vector3(
            point.x - localization.position.x,
            point.y - localization.position.y,
            point.z - localization.position.z
          )
      );
    }, [normalRoad.points, localization.position]);

    return <Line points={points} color="#d4d4d4" lineWidth={5} />;
  }
);

const Lanes = React.memo(
  ({ roads, localization }: { roads: Marker[]; localization: pointMarker }) => {
    return (
      <>
        {roads
          .filter((road) => road.type === 4)
          .map((filteredRoad) => (
            <Lane
              key={filteredRoad.id}
              normalRoad={filteredRoad}
              localization={localization}
            />
          ))}
      </>
    );
  }
);

export default Lanes;
