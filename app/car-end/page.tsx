"use client";
import { useEffect, useRef, useState } from "react";
import { Peer, DataConnection } from "peerjs";
import ROSLIB from "roslib";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Car = ({ remotePeerId = "cyber-control-peer-id" }) => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const connRef = useRef<DataConnection | null>(null);
  const rosRef = useRef<ROSLIB.Ros | null>(null);
  const imageListenerRefs = useRef<(ROSLIB.Topic | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);

  const feedbackListenerRef = useRef<ROSLIB.Topic | null>(null); // 新增的反馈监听器

  const cameraTopics = [
    "/miivii_gmsl_ros/camera1/compressed",
    "/miivii_gmsl_ros_front_camera/front_camera/compressed",
    "/miivii_gmsl_ros/camera2/compressed",
    "/miivii_gmsl_ros/camera3/compressed",
    "/miivii_gmsl_ros/camera4/compressed",
  ];

  useEffect(() => {
    const peer = new Peer("cyber-car-peer-id", {
      host: "111.186.56.118",
      port: 9000,
      path: "/cyber",
      secure: false,
      debug: 2,
      config: {
        iceServers: [
          {
            urls: "turn:111.186.56.118:3478",
            username: "test",
            credential: "123456",
          },
        ],
      },
    });

    peer.on("open", (id) => {
      setPeerId(id);
      console.log(`车端 peer ID: ${id}`);
      // 尝试连接到远程 peer
      const conn = peer.connect(remotePeerId, {
        label: "car-connection",
        metadata: { role: "car" },
        serialization: "binary",
        reliable: true,
      });
      connRef.current = conn;
      conn.on("open", () => {
        console.log("成功连接到控制端.");
        setConnected(true);
      });
      conn.on("data", (data) => {
        console.log(`接收到指令: ${data}`);
        // Handle the received command to control the car
      });
      conn.on("error", (error) => {
        console.error("无法连接到控制端:", error);
      });
      conn.on("close", () => {
        console.log("连接已关闭");
        setConnected(false);
        connRef.current = null; // 连接关闭时重置
      });
    });

    return () => {
      peer.destroy();
    };
  }, [remotePeerId]); // 添加 remotePeerId 作为依赖项

  useEffect(() => {
    if (!rosRef.current) {
      const ros = new ROSLIB.Ros({
        url: "ws://localhost:9090",
      });

      ros.on("connection", () => {
        console.log("成功连接到ROS.");
      });

      ros.on("error", (error) => {
        console.error("无法连接ROS:", error);
      });

      rosRef.current = ros;
    }

    cameraTopics.forEach((topic, index) => {
      if (imageListenerRefs.current[index]) {
        imageListenerRefs.current[index]!.unsubscribe();
      }

      if (!rosRef.current) {
        return;
      }

      const imageListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: topic,
        messageType: "sensor_msgs/CompressedImage",
      });

      imageListener.subscribe((message: any) => {
        // 将 Base64 编码的字符串解码为二进制数据
        const buffer = Buffer.from(message.data, "base64");
        // 从 Buffer 对象中提取 ArrayBuffer
        const arrayBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        );
        // 检查连接是否打开，然后发送带有 topic 和数据的对象
        if (connRef.current && connRef.current.open) {
          connRef.current.send({ topic, data: new Uint8Array(arrayBuffer) });
        }
      });

      imageListenerRefs.current[index] = imageListener;
    });

    // 订阅 "/diankong/full_vehicle_feedback" 话题
    if (feedbackListenerRef.current) {
      feedbackListenerRef.current.unsubscribe();
    }

    if (rosRef.current) {
      const feedbackListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/diankong/full_vehicle_feedback",
        messageType: "diankong/VehicleFeedback", // 确认具体的消息类型
      });

      console.log("尝试订阅 /diankong/full_vehicle_feedback");

      feedbackListener.subscribe((message) => {
        console.log("this is no okay");
        console.log("Received vehicle feedback:", message);
        // 处理收到的反馈信息，查看是否包含速度信息
        // if (message && message.speed) {
        //   console.log("Vehicle speed:", message.speed);
        // }
      });

      // 订阅失败的处理事件
      feedbackListener.on("error", (error) => {
        console.error(
          "Failed to subscribe to /diankong/full_vehicle_feedback:",
          error
        );
        // 可以在这里添加其他的错误处理逻辑，例如：
        // - 显示错误信息给用户
        // - 尝试重新连接
        // - 使用默认值
      });

      feedbackListenerRef.current = feedbackListener;
    }

    return () => {
      imageListenerRefs.current.forEach((listener) => {
        if (listener) {
          listener.unsubscribe();
        }
      });
      if (feedbackListenerRef.current) {
        feedbackListenerRef.current.unsubscribe();
      }
    };
  }, [connected]);

  return (
    <Card className="min-w-[600px]">
      <CardHeader>
        <CardTitle>车端的控制指令</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Peer ID: {peerId}</p>
        <p>Status: {connected ? "已连接" : "未连接"}</p>
      </CardContent>
    </Card>
  );
};

export default Car;
