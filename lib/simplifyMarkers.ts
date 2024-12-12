import { Color } from "three";

export interface Marker {
  id?: string;
  pose?: {
    position: {
      x: number;
      y: number;
      z: number;
    };
    orientation: { x: number; y: number; z: number; w: number };
  };

  type?: number;

  scale?: { x: number; y: number; z: number };

  color?: { r: number; g: number; b: number; a: number };

  text?: string;

  points?: { x: number; y: number; z: number }[];
}

export function simplifyMarkers_tarj(markers: Marker[]) {
  return markers.map((marker) => ({
    id: marker.id,
    position: {
      x: -marker.pose!.position.x,
      y: marker.pose!.position.z, // Swap y and z
      z: marker.pose!.position.y,
    },
  }));
}

export function bestTrajectory(trajectory: Marker[]) {
  return trajectory.map((marker) => ({
    id: marker.id,
    position: {
      x: -marker.points![0].x,
      y: marker.points![0].z,
      z: marker.points![0].y,
    },
  }));
}

export function simplifyMarkers_boundary(markers: Marker[]) {
  return markers.map((marker) => ({
    id: marker.id,
    position: {
      x: -marker.pose!.position.x,
      y: marker.pose!.position.z, // Swap y and z
      z: marker.pose!.position.y,
    },
    color: {
      r: marker.color!.r,
      g: marker.color!.g,
      b: marker.color!.b,
      a: marker.color!.a,
    },
  }));
}

export type pointMarker = {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
};

export function simplifyMarker_loc(message: any): pointMarker {
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

export function simplifyRoads(roads: Marker[]) {
  return roads.map((road) => ({
    id: road.id,
    type: road.type,
    points: road.points!.map((point) => ({
      x: -point.x,
      y: point.z,
      z: point.y,
    })),
    Color: road.color,
  }));
}

export function simplifyMarkers_obs(markers: Marker[]) {
  return markers.map((marker) => ({
    type: marker.type,
    text: marker.text,
    pose: {
      position: {
        x: -marker.pose!.position.x,
        y: marker.pose!.position.z, // Swap y and z
        z: marker.pose!.position.y, // Swap y and z
      },
      orientation: {
        x: marker.pose!.orientation.x,
        y: marker.pose!.orientation.z, // Swap y and z
        z: marker.pose!.orientation.y, // Swap y and z
        w: marker.pose!.orientation.w,
      },
    },
    scale: marker.scale,
    color: marker.color,
    points: marker.points!.map((point) => ({
      x: -point.x,
      y: point.z,
      z: point.y,
    })),
  }));
}
