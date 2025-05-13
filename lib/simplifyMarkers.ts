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

export type pointMarker = {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
};

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

//simplifyMarkers_predicted参数的类型pointMarker类型
export function simplifyMarkers_predicted(markers: Marker[]) {
  return markers.map((marker) => ({
    position: {
      x: -marker.pose!.position.x,
      y: marker.pose!.position.z, // Swap y and z
      z: marker.pose!.position.y, // Swap y and z
    },
  }));
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

export function simplifyPolygon_path(polygon: Marker[]) {
  return polygon.map((polygon) => ({
    id: polygon.id,
    color: polygon.color,
    points: polygon.points!.map((point) => ({
      x: -point.x,
      y: point.z,
      z: point.y,
    })),
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

/**
 * 处理 nav_msgs/Odometry 类型的消息
 * 用于延迟补偿开启时，将 /estimated_state 话题的数据转换为统一格式
 */
export function simplifyOdometryMsg(message: any) {
  return {
    position: {
      x: -message.pose.pose.position.x,
      y: message.pose.pose.position.z || 0, // Swap y and z, set default to 0
      z: message.pose.pose.position.y,
    },
    orientation: {
      x: message.pose.pose.orientation.x,
      y: message.pose.pose.orientation.z || 0, // Swap y and z, set default to 0
      z: message.pose.pose.orientation.y,
      w: message.pose.pose.orientation.w,
    },
    velocity: {
      linear: {
        x: message.twist.twist.linear.x,
        y: message.twist.twist.linear.y,
      },
      angular: {
        z: message.twist.twist.angular.z,
      }
    }
  };
}

/**
 * 处理 cyber_msgs/LocalizationEstimate 类型的消息
 * 用于延迟补偿关闭时，将 /localization/estimation 话题的数据转换为统一格式
 */
export function simplifyLocalizationEstimateMsg(message: any) {
  return {
    position: {
      x: -message.pose.position.x,
      y: message.pose.position.z || 0, // Swap y and z, set default to 0
      z: message.pose.position.y,
    },
    orientation: {
      x: message.pose.orientation.x,
      y: message.pose.orientation.z || 0, // Swap y and z, set default to 0 
      z: message.pose.orientation.y,
      w: message.pose.orientation.w,
    },
    velocity: {
      linear: {
        x: message.velocity.linear.x,
        y: message.velocity.linear.y,
      },
      angular: {
        z: message.velocity.angular.z,
      }
    }
  };
}
