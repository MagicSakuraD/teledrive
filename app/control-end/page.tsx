"use client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CircleCheck, LoaderCircle } from "lucide-react";

import React, { useEffect, useRef, useState } from "react";
import Peer, { DataConnection } from "peerjs";
import Gamepad from "./components/GamePad";
import VehicleControl from "./components/Pedal";
import TestWheel from "./components/test-wheel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { SelectTrigger } from "@radix-ui/react-select";

const ConnectionStatus = React.memo(({ connected }: { connected: boolean }) => (
  <span
    className={`text-sm ${connected ? "text-green-600" : "text-violet-500"}`}
  >
    {connected ? (
      <div className="flex flex-row gap-1 justify-center items-center">
        <CircleCheck className="w-4 h-4" />
        已连接
      </div>
    ) : (
      <div className="flex flex-row gap-1 justify-center items-center">
        <LoaderCircle className=" animate-spin w-4 h-4" />
        连接中...
      </div>
    )}
  </span>
));

const ControlEnd = () => {
  const [myPeerId, setMyPeerId] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("car-001");
  const imgRef = useRef<HTMLImageElement | null>(null);
  const secondimgRef = useRef<HTMLImageElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const [connected, setConnected] = useState(false);
  const [axes, setAxes] = useState<{
    rotation: number;
    brake: number;
    throttle: number;
  }>({
    rotation: 0,
    brake: 0,
    throttle: 0,
  });
  const [currentGear, setCurrentGear] = useState<string>("N");
  // 用于保存反馈速度的 state
  const [feedbackSpeed, setFeedbackSpeed] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const secondCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const cameraTopic = "/driver/fisheye/avm/compressed";
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const setCanvasSize = (
    canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
  ) => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // 获取设备像素比
      const devicePixelRatio = window.devicePixelRatio || 1;

      // 获取 CSS 尺寸
      const rect = canvas.getBoundingClientRect();

      // 根据设备像素比调整 canvas 的实际尺寸
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;

      // 缩放画布，以便绘制图像时保持清晰度
      context!.scale(devicePixelRatio, devicePixelRatio);
    }
  };

  useEffect(() => {
    const peer = new Peer("control-001", {
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
    peerRef.current = peer;

    peer.on("open", (id) => {
      setMyPeerId(id);
      console.log(`控制端 peer ID: ${id}`);
    });

    peer.on("connection", (conn) => {
      connRef.current = conn;

      conn.on("data", (data: unknown) => {
        if (data) {
          const { topic, data: receivedData } = data as {
            topic: string;
            data: any;
          };

          switch (topic) {
            case "feedback_sp":
              // 如果接收到的是速度反馈信息
              console.log("Received speed feedback:", receivedData);
              setFeedbackSpeed(receivedData); // 你可以将接收到的速度信息更新到状态中
              break;
            case "avm_camera":
              const blob = new Blob([receivedData], { type: "image/jpeg" });
              const url = URL.createObjectURL(blob);
              const img = new Image();
              img.src = url;
              img.onload = () => {
                if (canvasRef.current) {
                  setCanvasSize(canvasRef); // 调整 canvas 大小
                  const ctx = canvasRef.current.getContext("2d");
                  if (ctx) {
                    ctx.drawImage(
                      img,
                      0,
                      0,
                      canvasRef.current.width / window.devicePixelRatio, // 使用缩放后的尺寸
                      canvasRef.current.height / window.devicePixelRatio // 使用缩放后的尺寸
                    );
                  }
                  URL.revokeObjectURL(url);
                }
              };
              break;

            case "second_camera":
              const blob_second = new Blob([receivedData], {
                type: "image/jpeg",
              });
              const url_second = URL.createObjectURL(blob_second);
              const img_second = new Image();
              img_second.src = url_second;
              img_second.onload = () => {
                if (secondCanvasRef.current) {
                  setCanvasSize(secondCanvasRef); // 调整 canvas 大小
                  const ctx = secondCanvasRef.current.getContext("2d");
                  if (ctx) {
                    ctx.drawImage(
                      img_second,
                      0,
                      0,
                      secondCanvasRef.current.width / window.devicePixelRatio, // 使用缩放后的尺寸
                      secondCanvasRef.current.height / window.devicePixelRatio // 使用缩放后的尺寸
                    );
                  }
                  URL.revokeObjectURL(url_second);
                }
              };
              break;

            default:
              console.warn("收到的不是预期的数据格式");
              break;
          }
        } else {
          console.warn("收到的不是预期的数据格式");
        }
      });

      conn.on("open", () => {
        console.log("连接成功");
        setConnected(true);
      });

      conn.on("close", () => {
        setConnected(false);
      });

      conn.on("error", (err) => {
        console.log("连接失败", err);
        setConnected(false);
      });
    });

    return () => {
      if (peer) {
        peer.destroy();
      }
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const updateCanvas = () => {
      if (canvasRef.current && secondCanvasRef.current) {
        // 这里是处理绘图更新或其他每帧逻辑的地方
      }
      animationFrameId = requestAnimationFrame(updateCanvas);
    };

    // 启动动画循环
    animationFrameId = requestAnimationFrame(updateCanvas);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const sendControlData = () => {
      if (connRef.current && connRef.current.open) {
        const controlData = {
          axes,
          currentGear,
        };

        connRef.current.send({ topic: "axes", data: controlData });
      }

      // 递归调用 requestAnimationFrame 以实现循环发送
      animationFrameId = requestAnimationFrame(sendControlData);
    };

    // 启动循环发送
    animationFrameId = requestAnimationFrame(sendControlData);

    return () => cancelAnimationFrame(animationFrameId);
  }, [axes, currentGear]);

  useEffect(() => {
    if (!connected) {
      if (peerRef.current && remotePeerId) {
        const conn = peerRef.current.connect(remotePeerId, {
          label: "control-connection",
          metadata: { role: "controller" },
          serialization: "binary",
          reliable: true,
        });
        connRef.current = conn;

        conn.on("open", () => {
          console.log("连接成功");
          setConnected(true);
        });

        conn.on("error", (err) => {
          console.log("连接失败", err);
          setConnected(false);
        });

        conn.on("close", () => {
          console.log("连接已关闭");
          setConnected(false);
        });

        console.log("尝试连接", remotePeerId);
      }
    }
  }, [remotePeerId, connected]);

  const switchTopic = (newTopic: string) => {
    if (connRef.current) {
      connRef.current.send({ topic: "fisheye", data: newTopic });
    }
  };

  return (
    <div className="min-[2400px]:w-7/12">
      <Card className="overflow-hidden">
        <div className="flex flex-row items-center justify-center ">
          <div className="relative h-full w-[36%] ">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover aspect-square"
            />
            <div
              className="absolute bottom-24 left-1/2 transform -translate-x-1/2 translate-y-3/4
        backdrop-blur-md bg-white/30 bg-opacity-30 backdrop-filter text-center z-10 w-5/6 h-1/6 md:h-20 rounded-md"
            >
              <Gamepad
                axes={axes}
                setAxes={setAxes}
                currentGear={currentGear}
                setCurrentGear={setCurrentGear}
                feedbackSpeed={feedbackSpeed}
              />
            </div>
          </div>
          {/* 鱼眼相机 */}
          <div className="h-full w-[64%]">
            <canvas
              ref={secondCanvasRef}
              className="w-full h-full object-cover aspect-video"
            />
          </div>
        </div>

        <CardFooter className="flex flex-row justify-between py-2 w-full">
          <div className="flex gap-6 items-center mt-1">
            <p>
              控制端ID:
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                {myPeerId}
              </code>
            </p>
            <ConnectionStatus connected={connected} />
          </div>

          <Select onValueChange={switchTopic}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择摄像头" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="/driver/fisheye/front/compressed">
                前置摄像头
              </SelectItem>
              <SelectItem value="/driver/fisheye/back/compressed">
                后置摄像头
              </SelectItem>
              <SelectItem value="/driver/fisheye/left/compressed">
                左侧摄像头
              </SelectItem>
              <SelectItem value="/driver/fisheye/right/compressed">
                右侧摄像头
              </SelectItem>
            </SelectContent>
          </Select>
        </CardFooter>
      </Card>

      {/* <TestWheel setAxes={setAxes} /> */}
    </div>
  );
};

export default ControlEnd;
