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
import Car3D from "./components/Car3D";
import { pointMarker } from "@/lib/simplifyMarkers";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import SafetyChart from "./components/SafetyChart";
import { set } from "zod";
import { Preahvihear } from "next/font/google";

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
  const [currentGear, setCurrentGear] = useState<string>("D");
  // 用于保存反馈速度的 state
  const [feedbackSpeed, setFeedbackSpeed] = useState<number>(0);

  const [currentSteerAngle, setCurrentSteerAngle] = useState<number>(0);
  const [normalRoad, setNormalRoad] = useState<any>(null);
  const [trajectory, setTrajectory] = useState<any>(null);
  const [localization, setLocalization] = useState<pointMarker | null>(null);
  const [centralLines, setCentralLines] = useState<any>(null);
  const [boundary, setBoundary] = useState<any>(null);
  const [ploygonPath, setPolygonPath] = useState<any>(null);
  const [predictedPoint, setPredictedPoint] = useState<any>(null);

  const [obstacles, setObstacles] = useState<any>(null);
  // 状态来存储延迟和丢包率
  const [latency, setLatency] = useState<number>(0);
  // const [packetLoss, setPacketLoss] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [assistiveMode, setAssistiveMode] = useState(false);
  const [safetyContour, setSafetyContour] = useState<any>(null);

  // 延迟补偿开关状态
  const [delayCompensation, setDelayCompensation] = useState(false);

  //加速度
  const [acceleration, setAcceleration] = useState<number>(0);
  let animationFrameId: number;

  useEffect(() => {
    //create a peer
    const peer = new Peer("control-002", {
      host: "cyberc3-cloud-server.sjtu.edu.cn",
      port: 443,
      path: "/cyber",
      secure: true,
      debug: 2,
      config: {
        iceServers: [
          {urls:"stun:111.186.56.118:3478"},
          {
            urls: "turn:111.186.56.118:3478",
            username: "test",
            credential: "123456",
          },
          {
            urls: "turn:asia-east.relay.metered.ca:80",
            username: "c0f6e9eca6e8a8dd3ee14525",
            credential: "Yr/JEAAWgXYEg4AW",
          },
        ],
      },
    });
    peerRef.current = peer;

    //assign peer id
    peer.on("open", (id) => {
      setMyPeerId(id);
      console.log(`控制端 peer ID: ${id}`);

      // **控制端主动连接车端**
      if (!connected && peerRef.current && remotePeerId) {
        console.log("控制端尝试连接", remotePeerId);
        const conn = peerRef.current.connect(remotePeerId, {
          label: "control-connection",
          metadata: { role: "controller" },
          serialization: "binary",
          reliable: false,
        });

        connRef.current = conn;

        conn.on("open", () => {
          console.log("控制端成功连接到车端.");
          setConnected(true);
        });

        conn.on("data", (data: unknown) => {
          if (data) {
            const { topic, data: receivedData } = data as {
              topic: string;
              data: any;
            };

            switch (topic) {
              case "feedback_sp":
                // 如果接收到的是速度反馈信息

                setFeedbackSpeed(receivedData); // 你可以将接收到的速度信息更新到状态中
                break;

              case "feedback_steer":
                // 如果接收到的是转向反馈信息
                setCurrentSteerAngle(receivedData);
                // console.log("转向反馈信息", receivedData);
                break;

              case "road":
                // 如果接收到的是道路信息
                if (receivedData.length >= 2 && !normalRoad) {
                  setNormalRoad(receivedData); // 你可以将接收到的道路信息更新到状态中
                }
                break;

              case "traj":
                // 如果接收到的是轨迹信息
                setTrajectory(receivedData); // 你可以将接收到的轨迹信息更新到状态中
                break;

              case "localization":
                // 如果接收到的是定位信息
                // console.log("定位信息", receivedData);
                setLocalization(receivedData); // 你可以将接收到的定位信息更新到状态中
                break;

              case "CentralLines":
                // 如果接收到的是中心线信息

                setCentralLines(receivedData); // 你可以将接收到的中心线信息更新到状态中
                break;

              case "acceleration":
                // 如果接收到的是加速度信息
                setAcceleration(receivedData);
                break;

              case "obstacles":
                // 如果接收到的是障碍物信息
                // console.log("障碍物信息", receivedData);
                setObstacles(receivedData); // 你可以将接收到的障碍物信息更新到状态中
                break;

              case "path_boundary":
                // 如果接收到的是路径边界信息
                // console.log("路径边界信息", receivedData);
                setBoundary(receivedData); // 你可以将接收到的路径边界信息更新到状态中
                break;

              case "predicted_state":
                // 如果接收到的是估计状态信息
                // console.log("估计状态信息", receivedData);
                setPredictedPoint(receivedData); // 你可以将接收到的估计状态信息更新到状态中
                break;

              case "safetyContour":
                // 如果接收到的是安全轮廓信息
                setSafetyContour(receivedData); // 你可以将接收到的安全轮廓信息更新到状态中
                // console.log("安全轮廓信息", receivedData);
                break;

              case "polygon_path":
                // 如果接收到的是多边形路径信息,扇形可通行区域
                // console.log("多边形路径信息", receivedData);
                setPolygonPath(receivedData); // 你可以将接收到的多边形路径信息更新到状态中
                break;

              default:
                // console.warn("收到的不是预期的数据格式");

                console.log("未知话题:", topic);
                break;
            }
          } else {
            console.warn("收到的不是预期的数据格式");
          }
        });

        const monitorStats = () => {
          if (connRef.current) {
            startStatsMonitoring(connRef.current);
            animationFrameId = requestAnimationFrame(monitorStats);
          } else {
            cancelAnimationFrame(animationFrameId);
          }
        };

        monitorStats();

        conn.on("error", (err) => {
          console.log("控制端连接失败", err);
          setConnected(false);
        });

        conn.on("close", () => {
          console.log("控制端连接已关闭");
          setConnected(false);
        });
      }
    });

    // 控制端监听 `connection` 事件，以便后续车端可能主动连接过来
    // peer.on("connection", (conn) => {
    //   connRef.current = conn;
    // });

    // answer call
    peer.on("call", (call) => {
      call.answer(); // Answer the call without sending any media

      call.on("stream", (remoteStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
          videoRef.current.addEventListener("loadedmetadata", () => {
            videoRef.current?.play(); // Play the stream after metadata is loaded
          });
        } else {
          console.error("videoRef 未定义");
        }
      });

      call.on("close", () => {
        console.log("Call closed");
      });

      call.on("error", (err) => {
        console.error("Call error:", err);
      });
    });

    peer.on("disconnected", () => {
      console.log("Peer disconnected");
    });

    //handle error
    peer.on("error", (err) => {
      console.error("Peer error:", err);
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (connRef.current) {
        connRef.current.close();
        connRef.current = null;
      }
      cancelAnimationFrame(animationFrameId);
      console.log("关闭连接📴");
    };
  }, []);

  // useEffect(() => {
  //   let animationFrameId: number;

  //   const updateCanvas = () => {
  //     if (canvasRef.current && secondCanvasRef.current) {
  //       // 这里是处理绘图更新或其他每帧逻辑的地方
  //     }
  //     animationFrameId = requestAnimationFrame(updateCanvas);
  //   };

  //   // 启动动画循环
  //   animationFrameId = requestAnimationFrame(updateCanvas);

  //   return () => cancelAnimationFrame(animationFrameId);
  // }, []);

  // useEffect(() => {
  //   let animationFrameId: number;
  //   const sendControlData = () => {
  //     if (connRef.current && connRef.current.open) {
  //       const controlData = {
  //         axes,
  //         currentGear,
  //       };

  //       connRef.current.send({ topic: "axes", data: controlData });
  //     }

  //     // 递归调用 requestAnimationFrame 以实现循环发送
  //     animationFrameId = requestAnimationFrame(sendControlData);
  //   };

  //   return () => cancelAnimationFrame(animationFrameId);
  // }, [axes, currentGear]);

  useEffect(() => {
    if (connRef.current && connRef.current.open) {
      const controlData = {
        axes,
        currentGear,
      };

      connRef.current.send({ topic: "axes", data: controlData });
    }
  }, [axes, currentGear]); // 依赖数组中监听 axes 和 currentGear 的变化

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

  const startStatsMonitoring = async (conn: DataConnection) => {
    const peerConnection = conn.peerConnection as RTCPeerConnection;
    const stats = await peerConnection.getStats();
    stats.forEach((report) => {
      if (report.type === "candidate-pair") {
        const rtt_ms = report.currentRoundTripTime;
        if (rtt_ms !== undefined) {
          setLatency(rtt_ms);
          // console.log("延迟:", rtt_ms);
        }
      }
    });
  };

  // const switchChange = (checked: boolean) => {
  //   if (connRef.current) {
  //     connRef.current.send({ topic: "assistive_mode", data: checked });
  //   }
  // };

  // 监听 assistiveMode 状态变化
  useEffect(() => {
    // 只在状态变化后且连接存在时发送信息
    // console.log("assistiveMode:", assistiveMode);
    if (connRef.current) {
      connRef.current.send({ topic: "assistive_mode", data: assistiveMode });
    }
  }, [assistiveMode]); // 依赖于 assistiveMode

  // 简化 switchChange 函数，现在只负责更新状态
  const switchChange = (checked: boolean) => {
    setAssistiveMode(checked);
  };

  // 监听 delayCompensation 状态变化
  useEffect(() => {
    if (connRef.current) {
      connRef.current.send({
        topic: "delay_compensation",
        data: delayCompensation,
      });
      console.log("延迟补偿状态：", delayCompensation ? "开启" : "关闭");
    }
  }, [delayCompensation]);

  // 添加键盘事件监听器，用于空格键切换延迟补偿
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        // 防止按键事件重复触发
        e.preventDefault();
        setDelayCompensation((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="w-full min-[2460px]:w-5/6 flex flex-col gap-3 p-3 my-auto">
      <div className="flex flex-row gap-2 w-full">
        {/* threejs */}
        <Card className="basis-1/3 relative">
          {localization && (
            <>
              <Car3D
                localization={localization}
                obstacles={obstacles}
                trajectory={trajectory}
                centralLines={centralLines}
                boundary={boundary}
                normalRoad={normalRoad}
                ploygonPath={ploygonPath}
                predictedPoint={predictedPoint}
                safetyContourData={safetyContour}
              />

              <Badge
                variant={"outline"}
                className="absolute border-none bottom-0 right-0 z-10"
              >
                <SafetyChart
                  safetyData={safetyContour}
                  currentAngle={currentSteerAngle / -15.58} // 转换方向盘角度
                  currentAcceleration={acceleration}
                />
              </Badge>
            </>
          )}
        </Card>

        {/* video */}
        <Card className="overflow-hidden grow">
          <div className="relative">
            <video ref={videoRef} className="w-full h-auto aspect-[25/9]" />
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
              <div className="flex items-center space-x-2">
                <Label htmlFor="Assistive-mode">辅助模式</Label>
                <Switch
                  id="Assistive-mode"
                  onCheckedChange={switchChange}
                  checked={assistiveMode}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="delay-compensation">延迟补偿</Label>
                <Switch
                  id="delay-compensation"
                  onCheckedChange={(checked) => setDelayCompensation(checked)}
                  checked={delayCompensation}
                />
              </div>
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
      </div>

      <Card className=" backdrop-blur-xl bg-background/30">
        <div className="flex flex-row gap-4 p-2">
          <Gamepad
            axes={axes}
            setAxes={setAxes}
            currentGear={currentGear}
            setCurrentGear={setCurrentGear}
            feedbackSpeed={feedbackSpeed}
            setAssistiveMode={setAssistiveMode}
          />
        </div>
      </Card>
    </div>
  );
};

export default ControlEnd;
