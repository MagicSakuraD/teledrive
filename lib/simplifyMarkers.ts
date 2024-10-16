interface Marker {
  id: string;
  pose: {
    position: {
      x: number;
      y: number;
      z: number;
    };
  };
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };

  lifetime: {
    secs: number;
    nsecs: number;
  };
}

export function simplifyMarkers_tarj(markers: Marker[]) {
  return markers.map((marker) => ({
    id: marker.id,
    position: {
      x: marker.pose.position.x,
      y: marker.pose.position.y,
      z: marker.pose.position.z,
    },
    color: {
      r: marker.color.r,
      g: marker.color.g,
      b: marker.color.b,
      a: marker.color.a,
    },

    lifetime: marker.lifetime.secs + marker.lifetime.nsecs / 1e9, // Convert lifetime to seconds
  }));
}
