"use client";
import React from "react";

import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const PeerPage = () => {
  const [myPeerId, setMyPeerId] = useState<string>("");
  const [remotePeerId, setRemotePeerId] = useState<string>("");
  const [peer, setPeer] = useState<Peer | null>(null);
  const myVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const newPeer = new Peer();

    newPeer.on("open", (id) => {
      setMyPeerId(id);
    });
    0;
    newPeer.on("call", (call) => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (myVideoRef.current) {
            myVideoRef.current.srcObject = stream;
            myVideoRef.current.play();
          }
          call.answer(stream);
          call.on("stream", (remoteStream) => {
            console.log("i got remoteStream", remoteStream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play();
            }
          });
        });
    });

    setPeer(newPeer);

    return () => newPeer.destroy();
  }, []);

  const callPeer = (id: string) => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
          myVideoRef.current.play();
        }
        if (peer) {
          const call = peer.call(id, stream);
          call.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play();
            }
          });
        }
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
              // style={{ width: "300px", marginRight: "20px" }}
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
