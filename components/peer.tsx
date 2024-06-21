"use client";
import React from "react";

import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

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
      <h1>P2P Video Chat</h1>
      <div>
        <video
          ref={myVideoRef}
          style={{ width: "300px", marginRight: "20px" }}
        />
        <video ref={remoteVideoRef} style={{ width: "300px" }} />
      </div>
      <div>
        <p>Your ID: {myPeerId}</p>
        <input
          type="text"
          placeholder="Enter remote peer ID"
          value={remotePeerId}
          onChange={(e) => setRemotePeerId(e.target.value)}
        />
        <button onClick={() => callPeer(remotePeerId)}>Call</button>
      </div>
    </div>
  );
};

export default PeerPage;
