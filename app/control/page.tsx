"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircleCheck } from "lucide-react";

import React, { useEffect, useRef, useState } from "react";
import Peer, { DataConnection } from "peerjs";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { LoaderCircle } from "lucide-react";

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

const Control = () => {
  const [myPeerId, setMyPeerId] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("cyber-car-peer-id");
  const imgRef = useRef<HTMLImageElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const peer = new Peer("cyber-control-peer-id", {
      host: "111.186.56.118",
      port: 9000,
      path: "/cyber",
      secure: false,
      debug: 3,
      config: {
        iceServers: [
          {
            urls: "turn:111.186.56.118:3478",
            username: "test",
            credential: "123456",
          },
          // {
          //   urls: "turn:asia-east.relay.metered.ca:80",
          //   username: "c0f6e9eca6e8a8dd3ee14525",
          //   credential: "Yr/JEAAWgXYEg4AW",
          // },
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
        if (data instanceof Uint8Array) {
          const blob = new Blob([data], { type: "image/jpeg" }); // 直接用 Uint8Array 创建 Blob
          const url = URL.createObjectURL(blob);
          if (imgRef.current) {
            if (imgRef.current.src) {
              URL.revokeObjectURL(imgRef.current.src);
            }
            imgRef.current.src = url;
          }
        } else {
          console.warn("收到的不是预期的 Uint8Array 类型数据");
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
      connRef.current.send(newTopic);
    }
  };

  return (
    <div>
      <Card className="min-w-[1000px]">
        <CardContent className="p-0">
          <AspectRatio ratio={16 / 9}>
            <img
              src="/placeholder.svg"
              ref={imgRef}
              alt="Received image Frame"
              width={960}
              height={540}
              className="rounded-t-md w-full h-full object-cover"
            />
          </AspectRatio>
        </CardContent>
        <CardFooter className="flex flex-row justify-between py-2 w-full">
          <div className="flex gap-6 items-center mt-1">
            <p>
              控制端ID:
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                {myPeerId}
              </code>
            </p>
            <Select onValueChange={switchTopic}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择摄像头" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="/miivii_gmsl_ros_front_camera/front_camera/compressed">
                  前置摄像头
                </SelectItem>
                <SelectItem value="/miivii_gmsl_ros/camera1/compressed">
                  摄像头1
                </SelectItem>
                <SelectItem value="/miivii_gmsl_ros/camera2/compressed">
                  摄像头2
                </SelectItem>
                <SelectItem value="/miivii_gmsl_ros/camera3/compressed">
                  摄像头3
                </SelectItem>
                <SelectItem value="/miivii_gmsl_ros/camera4/compressed">
                  摄像头4
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ConnectionStatus connected={connected} />
        </CardFooter>
      </Card>
    </div>
  );
};

export default Control;
