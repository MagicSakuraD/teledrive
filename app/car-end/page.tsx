"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Peer, DataConnection } from "peerjs";
import ROSLIB from "roslib";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Car = ({ remotePeerId = "control-001" }) => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const connRef = useRef<DataConnection | null>(null);
  const rosRef = useRef<ROSLIB.Ros | null>(null);
  const imageListenerRefs = useRef<ROSLIB.Topic | null>(null);
  const secondImageListenerRef = useRef<ROSLIB.Topic | null>(null);
  const [feedback_sp, setSpeed] = useState<number | null>(0);
  // 使用 useRef 存储接收到的控制数据
  const controlDataRef = useRef({
    rotation: 0,
    brake: 0,
    throttle: 0,
    gear: "N",
  });

  const [showControl, setShowControl] = useState({
    rotation: 0,
    brake: 0,
    throttle: 0,
    gear: "N",
  });
  const [receivedCamera, setReceivedCamera] = useState<string>(
    "/driver/fisheye/front/compressed"
  );

  // const cameraTopics = [
  //   "/driver/fisheye/avm/compressed",
  //   // "/driver/fisheye/front/compressed",
  //   // "/driver/fisheye/left/compressed",
  //   // "/driver/fisheye/right/compressed",
  //   // "/driver/fisheye/back/compressed",
  // ];
  const avmCameraTopic = "/driver/fisheye/avm/compressed";

  useEffect(() => {
    const peer = new Peer("car-001", {
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
        reliable: true,
      });
      connRef.current = conn;
      conn.on("open", () => {
        console.log("成功连接到控制端.");
        setConnected(true);
      });

      conn.on("data", (data) => {
        try {
          const { topic, data: receivedData } = data as {
            topic: string;
            data: any;
          };

          switch (topic) {
            case "axes":
              // Type assertion for the "axes" topic
              const { axes, currentGear } = receivedData as {
                axes: {
                  rotation: number;
                  brake: number;
                  throttle: number;
                };
                currentGear: string;
              };

              // Update controlData state directly
              controlDataRef.current = {
                rotation: axes.rotation,
                brake: axes.brake,
                throttle: axes.throttle,
                gear: currentGear,
              };

              setShowControl({
                rotation: axes.rotation,
                brake: axes.brake,
                throttle: axes.throttle,
                gear: currentGear,
              });
              break;

            case "fisheye":
              console.log("接收到新的摄像头话题:", receivedData);
              // Type assertion for the "fisheye" topic
              const fisheyeUrl = receivedData as string;
              setReceivedCamera(fisheyeUrl);
              break;

            default:
              console.error("未知话题:", topic);
              break;
          }
        } catch (error) {
          console.error("解析接收到的数据时出错:", error);
        }
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
      const ros = new ROSLIB.Ros({ url: "ws://localhost:9090" });

      ros.on("connection", () => {
        console.log("成功连接到ROS.");
      });

      ros.on("error", (error) => {
        console.error("无法连接ROS:", error);
      });

      rosRef.current = ros;
    }

    if (connected) {
      // 订阅合成视角相机话题
      if (!rosRef.current) return;

      const imageListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: avmCameraTopic,
        messageType: "sensor_msgs/CompressedImage",
      });

      imageListener.subscribe((message: any) => {
        const buffer = Buffer.from(message.data, "base64");
        const arrayBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        );

        if (connRef.current && connRef.current.open) {
          connRef.current.send({
            topic: "avm_camera",
            data: new Uint8Array(arrayBuffer),
          });
        }
      });

      // 订阅速度反馈话题
      const feedbackListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/rock_can/speed_feedback",
        messageType: "cyber_msgs/SpeedFeedback",
      });

      feedbackListener.subscribe((message: any) => {
        if (message && message.speed) {
          setSpeed(message.speed_kmh);

          if (connRef.current && connRef.current.open) {
            connRef.current.send({
              topic: "feedback_sp",
              data: message.speed_kmh,
            });
          }
        }
      });

      // 控制话题
      const controlTopic = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/rock_can/steer_command",
        messageType: "cyber_msgs/steer_cmd",
      });

      const speedTopic = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/rock_can/speed_command",
        messageType: "cyber_msgs/speed_cmd",
      });

      const brakeTopic = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/rock_can/brake_command",
        messageType: "cyber_msgs/brake_cmd",
      });

      const sendControlData = () => {
        if (rosRef.current && connected) {
          const controlDataMessage = new ROSLIB.Message({
            is_updated: true,
            enable_auto_steer: true,
            steer_cmd: controlDataRef.current.rotation,
          });

          controlTopic.publish(controlDataMessage);

          const speedDataMessage = new ROSLIB.Message({
            is_updated: true,
            enable_auto_speed: true,
            speed_cmd: controlDataRef.current.throttle * 1000,
            acc_cmd: 0,
            gear: 1,
          });

          speedTopic.publish(speedDataMessage);

          const brakeDataMessage = new ROSLIB.Message({
            enable_auto_brake: true,
            deceleration: controlDataRef.current.brake * -5,
          });

          brakeTopic.publish(brakeDataMessage);
        }

        requestAnimationFrame(sendControlData);
      };

      sendControlData();

      return () => {
        imageListener.unsubscribe();
        feedbackListener.unsubscribe();
        controlTopic.unsubscribe();
        speedTopic.unsubscribe();
        brakeTopic.unsubscribe();
      };
    }
  }, [connected]);

  useEffect(() => {
    if (rosRef.current) {
      // 初始化或获取控制 topic
      //切换视角
      const secondImageListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: receivedCamera,
        messageType: "sensor_msgs/CompressedImage",
      });

      secondImageListener.subscribe((message: any) => {
        // 将 Base64 编码的字符串解码为二进制数据
        const buffer = Buffer.from(message.data, "base64");
        // 从 Buffer 对象中提取 ArrayBuffer
        const arrayBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        );
        // 检查连接是否打开，然后发送 ArrayBuffer
        if (connRef.current && connRef.current.open) {
          connRef.current.send({
            topic: "second_camera",
            data: new Uint8Array(arrayBuffer),
          });
        }
      });
      return () => {
        if (secondImageListener) {
          secondImageListener.unsubscribe();
        }
      };
    }
  }, [receivedCamera]);

  return (
    <Card className="min-w-[600px]">
      <CardHeader>
        <CardTitle>车端的控制指令</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Peer ID: {peerId}</p>
        <p>Status: {connected ? "已连接" : "未连接"}</p>
        <p>转向: {Math.floor(showControl.rotation)}°</p>
        <p>刹车: {Math.floor(showControl.brake * 100)}%</p>
        <p>油门: {Math.floor(showControl.throttle * 100)}%</p>
        <p>挡位: {showControl.gear}</p>
        <p>速度：{feedback_sp}</p>
        <p>摄像头： {receivedCamera}</p>
      </CardContent>
    </Card>
  );
};

export default Car;
