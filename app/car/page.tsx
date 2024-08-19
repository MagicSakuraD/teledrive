"use client";
import { useEffect, useRef, useState } from "react";
import { Peer, DataConnection } from "peerjs";
import ROSLIB from "roslib";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Car = ({ remotePeerId = "cyber-control-peer-id" }) => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [receivedCommand, setReceivedCommand] = useState<string>(
    "/driver/fisheye/avm/compressed"
  );
  const connRef = useRef<DataConnection | null>(null);
  const rosRef = useRef<ROSLIB.Ros | null>(null);
  const imageListenerRef = useRef<ROSLIB.Topic | null>(null);

  useEffect(() => {
    const peer = new Peer("cyber-car-peer-id", {
      host: "cyberc3-cloud-server.sjtu.edu.cn",
      port: 443,
      path: "/cyber",
      secure: true,
      debug: 2,
      config: {
        iceServers: [
          {
            urls: "turn:asia-east.relay.metered.ca:80",
            username: "c0f6e9eca6e8a8dd3ee14525",
            credential: "Yr/JEAAWgXYEg4AW",
          },
          {
            urls: "turn:cyberc3-cloud-server.sjtu.edu.cn:3478",
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
        reliable: false,
      });
      connRef.current = conn;
      conn.on("open", () => {
        console.log("成功连接到控制端.");
        setConnected(true);
      });
      conn.on("data", (data: any) => {
        setReceivedCommand(data as string);
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

    if (imageListenerRef.current) {
      imageListenerRef.current.unsubscribe();
    }

    const imageListener = new ROSLIB.Topic({
      ros: rosRef.current,
      name: receivedCommand,
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
      // 检查连接是否打开，然后发送 ArrayBuffer
      if (connRef.current && connRef.current.open) {
        connRef.current.send(arrayBuffer);
      }
    });

    imageListenerRef.current = imageListener;

    return () => {
      if (imageListener) {
        imageListener.unsubscribe();
      }
    };
  }, [receivedCommand]);

  return (
    <Card className="min-w-[600px]">
      <CardHeader>
        <CardTitle>车端的控制指令</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Peer ID: {peerId}</p>
        <p>Status: {connected ? "已连接" : "未连接"}</p>
        <p>Received Command: {receivedCommand}</p>
      </CardContent>
    </Card>
  );
};

export default Car;
