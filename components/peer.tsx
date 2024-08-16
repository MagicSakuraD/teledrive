"use client";
import React from "react";

import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const PeerPage = () => {
  const [myPeerId, setMyPeerId] = useState<string>("");
  const [remotePeerId, setRemotePeerId] = useState<string>("");
  const [peer, setPeer] = useState<Peer | null>(null);
  const myVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const newPeer = new Peer({
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

    newPeer.on("open", (id) => {
      setMyPeerId(id);
    });

    newPeer.on("call", (call) => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (myVideoRef.current) {
            myVideoRef.current.srcObject = stream;
            myVideoRef.current.play();
          }
          call.answer(stream);
          call.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play();
            }
          });

          // 在接收端监听数据通道的消息
          call.peerConnection.ondatachannel = (event) => {
            const dataChannel = event.channel;
            dataChannel.onmessage = (e) => {
              const { timestamp } = JSON.parse(e.data);
              const currentTimestamp = performance.now();
              const latency = currentTimestamp - timestamp;
              console.log(`Received timestamp: ${timestamp} ms`);
              console.log(`Current timestamp: ${currentTimestamp} ms`);
              console.log(`Latency: ${latency} ms`);
            };
          };
        });
    });

    setPeer(newPeer);

    return () => newPeer.destroy();
  }, []);

  const callPeer = (id: string) => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
          myVideoRef.current.play();
        }
        if (peer) {
          const call = peer.call(id, stream);
          if (!call) {
            console.error("Failed to make a call");
            return;
          }

          // 创建一个RTCDataChannel来发送时间戳
          const dataChannel = peer.connect(id);
          dataChannel.on("open", () => {
            const sendTimestamp = () => {
              const timestamp = performance.now();
              dataChannel.send(JSON.stringify({ timestamp }));
              console.log(`Sent timestamp: ${timestamp} ms`);
            };

            // 每隔一段时间发送一个时间戳，或者在需要的时候发送
            setInterval(sendTimestamp, 1000); // 1秒间隔发送
          });

          call.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play();
            }
          });
        } else {
          console.error("Peer object is not initialized");
        }
      })
      .catch((error) => {
        console.error("Failed to get user media:", error);
      });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-2 w-full justify-center items-center">
        <Card className="min-w-[500px]">
          <CardHeader>
            <CardTitle>local</CardTitle>
          </CardHeader>
          <CardContent>
            <video
              ref={myVideoRef}
              className="bg-muted/50  rounded-lg w-full"
            />
          </CardContent>
        </Card>

        <Card className="min-w-[500px]">
          <CardHeader>
            <CardTitle>remote</CardTitle>
          </CardHeader>
          <CardContent>
            <video
              ref={remoteVideoRef}
              className="bg-muted/50 rounded-lg w-full"
            />
          </CardContent>
        </Card>
      </div>
      <div className="text-lg text-muted-foreground mt-10">
        <p>
          Your ID:
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold">
            {myPeerId}
          </code>
        </p>
        <div className="flex flex-row gap-5 w-3/5 mt-3">
          <Input
            type="text"
            placeholder="Enter remote peer ID"
            value={remotePeerId}
            onChange={(e) => setRemotePeerId(e.target.value)}
          />
          <Button onClick={() => callPeer(remotePeerId)}>Call</Button>
        </div>
      </div>
    </div>
  );
};

export default PeerPage;
