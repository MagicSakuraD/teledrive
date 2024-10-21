export interface Marker {
  id?: string;
  pose: {
    position: {
      x: number;
      y: number;
      z: number;
    };
    orientation: { x: number; y: number; z: number; w: number };
  };

  lifetime?: {
    secs: number;
    nsecs: number;
  };

  type?: number;

  scale?: { x: number; y: number; z: number };
}

export function simplifyMarkers_tarj(markers: Marker[]) {
  return markers.map((marker) => ({
    id: marker.id,
    position: {
      x: -marker.pose.position.x,
      y: marker.pose.position.z, // Swap y and z
      z: marker.pose.position.y,
    },

    lifetime: marker.lifetime!.secs + marker.lifetime!.nsecs / 1e9, // Convert lifetime to seconds
  }));
}

export type carMarker = {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
};

export function simplifyMarker_loc(message: any): carMarker {
  return {
    position: {
      x: -message.pose.position.x,
      y: message.pose.position.z, // Swap y and z
      z: message.pose.position.y, // Swap y and z
    },
    orientation: {
      x: message.pose.orientation.x,
      y: message.pose.orientation.z, // Swap y and z
      z: message.pose.orientation.y, // Swap y and z
      w: message.pose.orientation.w,
    },
  };
}

export function simplifyMarkers_obs(markers: any[]): Marker[] {
  return markers.map((marker) => {
    switch (marker.type) {
      case 9:
        return {
          type: marker.type,
          position: {
            x: -marker.pose.position.x,
            y: marker.pose.position.z, // Swap y and z
            z: marker.pose.position.y, // Swap y and z
          },
          orientation: {
            x: -marker.pose.orientation.x,
            y: marker.pose.orientation.z, // Swap y and z
            z: marker.pose.orientation.y, // Swap y and z
            w: marker.pose.orientation.w,
          },
          scale: marker.scale,
        };

      default:
        return marker; // 对于其他类型，返回原始对象
    }
  });
}
