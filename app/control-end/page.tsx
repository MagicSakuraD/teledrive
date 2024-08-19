"use client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CircleCheck, LoaderCircle, Wifi } from "lucide-react";

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
  SelectTrigger,
} from "@/components/ui/select";
import {} from "@radix-ui/react-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
        <LoaderCircle className="animate-spin w-4 h-4" />
        连接中...
      </div>
    )}
  </span>
));

const ControlEnd = () => {
  const [myPeerId, setMyPeerId] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("car-002");
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

  // 状态来存储延迟和丢包率
  const [latency, setLatency] = useState<number>(0);
  const [packetLoss, setPacketLoss] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const peer = new Peer("control-002", {
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

    // Handle incoming calls
    peer.on("call", (call) => {
      call.answer(); // Answer the call without sending any media

      call.on("stream", (remoteStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
          videoRef.current.addEventListener("loadedmetadata", () => {
            if (videoRef.current) {
              videoRef.current.play(); // Play the stream after metadata is loaded
            }
          });
        }
      });

      call.on("close", () => {
        console.log("Call closed");
      });

      call.on("error", (err) => {
        console.error("Call error:", err);
      });
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
        startStatsMonitoring(conn);
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
          reliable: false,
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

  const reconnect = () => {
    if (peerRef.current) {
      peerRef.current.reconnect();
    }
  };

  const startStatsMonitoring = (conn: DataConnection) => {
    const peerConnection = conn.peerConnection as RTCPeerConnection;
    if (peerConnection) {
      setInterval(async () => {
        const stats = await peerConnection.getStats();
        let latency = 0;
        stats.forEach((report) => {
          // console.log(report);
          if (report.type === "candidate-pair") {
            latency = report.currentRoundTripTime;
          }
        });

        setLatency(latency || 0);
      }, 1000); // 每秒更新一次
    }
  };

  return (
    <div className="w-full min-[2400px]:w-7/12 flex flex-col gap-3">
      <Card className="overflow-hidden">
        <div className="relative">
          <video ref={videoRef} className="w-full h-auto bg-black" />
          <Badge
            variant={"outline"}
            className="absolute border-none top-0 right-0 flex flex-row gap-1 items-center text-green-600 z-10"
          >
            <Wifi className="w-4 h-4" />
            <p className="text-xs">
              延迟: <b className="">{`${latency * 1000} ms`}</b>
            </p>
          </Badge>
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

            {!connected && (
              <Button variant="outline" onClick={reconnect}>
                重新连接
              </Button>
            )}
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

      <Card>
        <div className="flex flex-row gap-4 p-3">
          <Gamepad
            axes={axes}
            setAxes={setAxes}
            currentGear={currentGear}
            setCurrentGear={setCurrentGear}
            feedbackSpeed={feedbackSpeed}
          />
        </div>
      </Card>

      {/* <TestWheel setAxes={setAxes} /> */}
    </div>
  );
};

export default ControlEnd;
