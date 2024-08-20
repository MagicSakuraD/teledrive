"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { DataConnection, MediaConnection } from "peerjs";
import ROSLIB from "roslib";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Car = ({ remotePeerId = "control-002" }) => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const connRef = useRef<DataConnection | null>(null);
  const rosRef = useRef<ROSLIB.Ros | null>(null);
  const imageListenerRef = useRef<ROSLIB.Topic | null>(null);

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

  const avmCameraTopic = "/driver/fisheye/avm/compressed";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peerRef = useRef<Peer | null>(null);

  const [callStarted, setCallStarted] = useState(false);
  const mediaConnectionRef = useRef<MediaConnection | null>(null);
  // UseRefs to store the latest images
  const avmImageRef = useRef<HTMLImageElement | null>(null);
  const receivedImageRef = useRef<HTMLImageElement | null>(null);

  const drawImagesOnCanvas = (ctx: CanvasRenderingContext2D | null) => {
    if (canvasRef.current && avmImageRef.current && receivedImageRef.current) {
      const avmImage = avmImageRef.current;
      const receivedImage = receivedImageRef.current;

      const radio = avmImage.height / receivedImage.height;
      const imageHeight = avmImage.height;

      const avmimageWidth = avmImage.width;
      const secondImageWidth = receivedImage.width * radio;

      if (
        canvasRef.current.width !== secondImageWidth + avmimageWidth ||
        canvasRef.current.height !== imageHeight
      ) {
        canvasRef.current.width = secondImageWidth + avmimageWidth;
        canvasRef.current.height = imageHeight;
      }

      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(avmImage, 0, 0, avmimageWidth, imageHeight);
        ctx.drawImage(
          receivedImage,
          avmimageWidth,
          0,
          secondImageWidth,
          imageHeight
        );
      }
    }
  };

  useEffect(() => {
    const peer = new Peer("car-002", {
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

    if (peer) {
      peerRef.current = peer;
    }

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
      if (!rosRef.current || !canvasRef.current) return;

      const ctx = canvasRef.current.getContext("2d");
      const videoStream = canvasRef.current.captureStream();

      if (!callStarted && peerRef.current && peerRef.current.open) {
        const call = peerRef.current.call(remotePeerId, videoStream);
        mediaConnectionRef.current = call;
        setCallStarted(true);

        call.on("close", () => {
          console.log("Call closed");
          setCallStarted(false);
        });

        call.on("error", (err) => {
          console.error("Call error:", err);
          setCallStarted(false);
        });
      }

      const imageListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: avmCameraTopic,
        messageType: "sensor_msgs/CompressedImage",
      });

      imageListener.subscribe((message: any) => {
        const avmImage = new Image();
        avmImage.src = `data:image/jpeg;base64,${message.data}`;

        avmImage.onload = () => {
          avmImageRef.current = avmImage;
          drawImagesOnCanvas(ctx);
        };
      });

      // 订阅速度反馈话题
      const feedbackListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/rock_can/speed_feedback",
        messageType: "cyber_msgs/SpeedFeedback",
      });

      feedbackListener.subscribe((message: any) => {
        if (message) {
          setSpeed(message.speed_cms);

          if (connRef.current && connRef.current.open) {
            connRef.current.send({
              topic: "feedback_sp",
              data: message.speed_cms,
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
            steer_cmd: controlDataRef.current.rotation * -1,
          });

          controlTopic.publish(controlDataMessage);

          let gear_num: number = 0;
          switch (controlDataRef.current.gear) {
            case "D":
              gear_num = 1;
              break;
            case "R":
              gear_num = 2;
              break;
            case "N":
              gear_num = 0;
              break;
            case "p":
              gear_num = 0;
              break;
            default:
              gear_num = 0;
              break;
          }

          const speedDataMessage = new ROSLIB.Message({
            is_updated: true,
            enable_auto_speed: true,
            speed_cmd: controlDataRef.current.throttle * 1000,
            acc_cmd: 0,
            gear: gear_num,
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

        if (mediaConnectionRef.current) {
          mediaConnectionRef.current.close();
          mediaConnectionRef.current = null;
        }
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
      if (imageListenerRef.current) {
        imageListenerRef.current.unsubscribe();
      }

      imageListenerRef.current = new ROSLIB.Topic({
        ros: rosRef.current,
        name: receivedCamera,
        messageType: "sensor_msgs/CompressedImage",
      });
      console.log(`订阅后话题🤑: ${receivedCamera}`);

      imageListenerRef.current.subscribe((message: any) => {
        const receivedImage = new Image();
        receivedImage.src = `data:image/jpeg;base64,${message.data}`;

        receivedImage.onload = () => {
          receivedImageRef.current = receivedImage;
        };
      });
      return () => {
        if (imageListenerRef.current) {
          imageListenerRef.current.unsubscribe();
        }
      };
    }
  }, [receivedCamera]);

  return (
    <Card className="min-w-[600px]">
      <CardHeader>
        <CardTitle>车端信息</CardTitle>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} className="" />
        <p>车端ID: {peerId}</p>
        <p>状态: {connected ? "已连接" : "未连接"}</p>
        <p>转向: {Math.floor(showControl.rotation)}°</p>
        <p>刹车: {Math.floor(showControl.brake * 100)}%</p>
        <p>油门: {Math.floor(showControl.throttle * 100)}%</p>
        <p>挡位: {showControl.gear}</p>
        <p>速度：{feedback_sp} cm/s</p>
        <p>摄像头：{receivedCamera}</p>
      </CardContent>
    </Card>
  );
};

export default Car;
