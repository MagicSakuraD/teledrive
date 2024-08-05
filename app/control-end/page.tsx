"use client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CircleCheck, LoaderCircle } from "lucide-react";

import React, { useEffect, useRef, useState } from "react";
import Peer, { DataConnection } from "peerjs";
import Gamepad from "./GamePad";
import VehicleControl from "./Pedal";

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
  const [remotePeerId, setRemotePeerId] = useState("car-id");
  const imgRefs = useRef<(HTMLImageElement | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
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
  const [feedbackSpeed, setFeedbackSpeed] = useState<number | null>(0);

  const cameraTopics = [
    "/miivii_gmsl_ros/camera1/compressed",
    "/miivii_gmsl_ros_front_camera/front_camera/compressed",
    "/miivii_gmsl_ros/camera2/compressed",
    "/miivii_gmsl_ros/camera3/compressed",
    "/miivii_gmsl_ros/camera4/compressed",
  ];

  useEffect(() => {
    const peer = new Peer("control-id", {
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
    peerRef.current = peer;

    peer.on("open", (id) => {
      setMyPeerId(id);
      console.log(`控制端 peer ID: ${id}`);
    });

    peer.on("connection", (conn) => {
      connRef.current = conn;

      conn.on("data", (data: unknown) => {
        if (
          data &&
          typeof data === "object" &&
          "topic" in data &&
          "data" in data
        ) {
          const { topic, data: imageData } = data as {
            topic: string;
            data: any;
          };
          const blob = new Blob([imageData], { type: "image/jpeg" });
          const url = URL.createObjectURL(blob);
          const index = cameraTopics.indexOf(topic);
          if (index !== -1 && imgRefs.current[index]) {
            if (imgRefs.current[index]!.src) {
              URL.revokeObjectURL(imgRefs.current[index]!.src);
            }
            imgRefs.current[index]!.src = url;
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

    const sendControlData = () => {
      if (connRef.current && connRef.current.open) {
        const controlData = {
          axes,
          currentGear,
        };

        connRef.current.send(controlData);
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

  return (
    <div className="container">
      <div className="grid grid-cols-4 gap-x-4 gap-y-2">
        {cameraTopics.map((topic, index) => (
          <div
            key={topic}
            className={`aspect-video ${
              index === 1 ? "col-span-2 row-span-2" : ""
            }`}
          >
            <img
              src="/placeholder.svg"
              ref={(el) => {
                imgRefs.current[index] = el;
              }}
              alt={`Received image from ${topic}`}
              width={960}
              height={540}
              className="w-full h-full object-cover rounded-md"
            />
          </div>
        ))}
      </div>
      <div className="mb-3">
        <CardFooter className="flex flex-row justify-between py-2 px-0 w-full">
          <div className="flex gap-6 items-center mt-1">
            <p>
              控制端ID:
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                {myPeerId}
              </code>
            </p>
          </div>
          <ConnectionStatus connected={connected} />
        </CardFooter>
      </div>
      <Gamepad
        axes={axes}
        setAxes={setAxes}
        currentGear={currentGear}
        setCurrentGear={setCurrentGear}
      />
    </div>
  );
};

export default ControlEnd;
