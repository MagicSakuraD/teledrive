"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { DataConnection, MediaConnection } from "peerjs";
import ROSLIB from "roslib";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import drawGuideLine from "@/lib/drawGuideLine";
import drawText from "@/lib/drawtext";
import { set } from "zod";
import {
  simplifyMarkers_tarj,
  simplifyMarker_loc,
  simplifyMarkers_obs,
  simplifyMarkers_boundary,
  simplifyRoads,
  bestTrajectory,
  simplifyPolygon_path,
  simplifyMarkers_predicted,
} from "@/lib/simplifyMarkers";

const Car = ({ remotePeerId = "control-002" }) => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const connRef = useRef<DataConnection | null>(null);
  const rosRef = useRef<ROSLIB.Ros | null>(null);
  const imageListenerRef = useRef<ROSLIB.Topic | null>(null);

  const [feedback_sp, setSpeed] = useState<number | null>(0);
  const [steer_angle, setSteerAngle] = useState<number | null>(0);
  const steerAngleRef = useRef<number | null>(0);
  const passableWidthRef = useRef<string>("width: 0");
  const passableLengthRef = useRef<string>("length: 0");
  const gearRef = useRef<string | null>("N");

  // 状态来存储延迟
  const [latencyRTT, setLatencyRTT] = useState<number>(0);

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

  // const [callStarted, setCallStarted] = useState(false);
  const [assistive_mode, setAssistiveMode] = useState(false);
  const mediaConnectionRef = useRef<MediaConnection | null>(null);
  // UseRefs to store the latest images
  const avmImageRef = useRef<HTMLImageElement | null>(null);
  const receivedImageRef = useRef<HTMLImageElement | null>(null);

  let rttArray: number[] = []; // RTT 延时数据数组
  const maxRTTArrayLength = 10; // 数据达到 10 条时发送

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

        drawGuideLine(
          avmimageWidth / 2,
          imageHeight / 2,
          (steerAngleRef.current ?? 1) / 15.58,
          ctx,
          gearRef.current ?? "N"
        );

        // drawText(ctx, `${passableWidthRef.current}`, avmimageWidth / 2, 40);

        // drawText(ctx, `${passableLengthRef.current}`, avmimageWidth / 2, 100);
      }
    }
  };

  useEffect(() => {
    // 创建 Peer 实例
    const peer = new Peer("car-002", {
      host: "cyberc3-cloud-server.sjtu.edu.cn",
      port: 443,
      path: "/cyber",
      secure: true,
      debug: 2,
      config: {
        iceServers: [
          // { urls: "turn:0.peerjs.com:3478" },
          // { urls: "stun:stun.l.google.com:19302" },
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

    // assign peer ID
    peer.on("open", (id) => {
      setPeerId(id);
      console.log(`车端 peer ID: ${id}`);
    });

    //Receive connection,只监听，不主动连接
    peer.on("connection", (conn) => {
      console.log("车端连接到控制端:", conn.peer);

      connRef.current = conn;

      conn.on("open", () => {
        console.log("成功连接到控制端.");
        setConnected(true);
        // 监听控制端发送的数据
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

            // setAssistiveMode
            case "assistive_mode":
              // Type assertion for the "assistive_mode" topic
              const assistiveMode = receivedData as boolean;
              setAssistiveMode(assistiveMode);
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
        setConnected(false); // 更新状态
      });
      conn.on("close", () => {
        console.log("连接已关闭");
        setConnected(false);
        connRef.current = null; // 连接关闭时重置
      });
    });

    // 尝试连接到远程 peer
    // const conn = peer.connect(remotePeerId, {
    //   label: "car-connection",
    //   metadata: { role: "car" },
    //   serialization: "binary",
    //   reliable: false,
    // });

    // Handle incoming data
    peer.on("error", (error) => {
      console.error("Peer error:", error.type, error);
      // 根据错误类型采取措施，例如重连或提示用户
      if (error.type === "peer-unavailable") {
        console.log("控制端不可用，请检查 remotePeerId");
      }
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
      console.log("车端 peer已关闭📴.");
    };
  }, []); // 添加 remotePeerId 作为依赖项

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

    if (connected && rosRef.current) {
      // 订阅合成视角相机话题
      if (!canvasRef.current) return;

      const ctx = canvasRef.current.getContext("2d");
      const videoStream = canvasRef.current.captureStream();

      if (peerRef.current && peerRef.current.open) {
        const call = peerRef.current.call(remotePeerId, videoStream);
        mediaConnectionRef.current = call;
        // setCallStarted(true);

        call.on("close", () => {
          console.log("Call closed");
          setConnected(false);
          // setCallStarted(false);
        });

        call.on("error", (err) => {
          console.error("Call error:", err);
          setConnected(false);
          // setCallStarted(false);
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
          switch (message.gear) {
            case 11:
              gearRef.current = "D";
              break;
            case 9:
              gearRef.current = "R";
              break;
            case 0:
              gearRef.current = "N";
              break;
            case 10:
              gearRef.current = "P";
              break;
            default:
              gearRef.current = "N";
              break;
          }

          if (connRef.current && connRef.current.open) {
            connRef.current.send({
              topic: "feedback_sp",
              data: message.speed_cms,
            });
          }
        }
      });

      // 订阅车辆转角话题
      const steerListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/rock_can/steer_feedback",
        messageType: "cyber_msgs/SteerFeedback",
      });

      steerListener.subscribe((message: any) => {
        if (message) {
          setSteerAngle(parseFloat(message.SteerAngle.toFixed(2)));
          steerAngleRef.current =
            parseFloat(message.SteerAngle.toFixed(2)) * -1;
          if (connRef.current && connRef.current.open) {
            connRef.current.send({
              topic: "feedback_steer",
              data: message.SteerAngle,
            });
          }
        }
      });

      // 订阅道路话题normal_lane
      const roadListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/visualization/hdmap/normal_lane",
        messageType: "visualization_msgs/MarkerArray",
      });

      roadListener.subscribe((message: any) => {
        if (message) {
          if (connRef.current && connRef.current.open) {
            connRef.current.send({
              topic: "road",
              data: simplifyRoads(message.markers),
            });
          }
        }
      });

      // 订阅车辆位置话题/visualization/localization
      const localizationListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/visualization/localization",
        messageType: "visualization_msgs/Marker",
      });

      localizationListener.subscribe((message: any) => {
        if (message) {
          if (connRef.current && connRef.current.open) {
            connRef.current.send({
              topic: "localization",
              data: simplifyMarker_loc(message),
            });
          }
        }
      });

      //这是我最新的源代码，把补偿时延的自车估计加上了，补偿时延后的自车定位话题是/estimated_state，消息类型是nav_msgs::Odometry，里面包括est_msg.pose.pose.position.x  est_msg.pose.pose.position.y  est_msg.pose.pose.orientation（位置和朝向）
      //订阅车辆位置话题/visualization/estimated_state
      //更新为话题 /predicted_state 消息类型 visualization_msgs::MarkerArray
      const predictedStateListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/predicted_state",
        messageType: "visualization_msgs/MarkerArray",
      });

      predictedStateListener.subscribe((message: any) => {
        if (message) {
          if (connRef.current && connRef.current.open) {
            connRef.current.send({
              topic: "predicted_state",
              data: simplifyMarkers_predicted(message.markers),
            });
          }
        }
      });

      //订阅障碍物话题/visualization/obstacles
      // const obstaclesListener = new ROSLIB.Topic({
      //   ros: rosRef.current,
      //   name: "/visualization/obstacles",
      //   messageType: "visualization_msgs/MarkerArray",
      // });

      // obstaclesListener.subscribe((message: any) => {
      //   if (message) {
      //     // console.log("障碍物", message.markers);
      //     if (connRef.current && connRef.current.open) {
      //       connRef.current.send({
      //         topic: "obstacles",
      //         data: simplifyMarkers_obs(message.markers),
      //       });
      //     }
      //   }
      // });

      // 订阅车辆轨迹话题traj
      // const trajListener = new ROSLIB.Topic({
      //   ros: rosRef.current,
      //   name: "/visulization/traj",
      //   messageType: "visualization_msgs/MarkerArray",
      // });

      // trajListener.subscribe((message: any) => {
      //   if (message) {
      //     console.log("轨迹", message.markers);
      //     if (connRef.current && connRef.current.open) {
      //       connRef.current.send({
      //         topic: "traj",
      //         data: simplifyMarkers_tarj(message.markers),
      //       });
      //     }
      //   }
      // });

      // 订阅车辆最好轨迹/visualization/best_trajectories
      const bestTrajListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/visualization/best_trajectories",
        messageType: "visualization_msgs/MarkerArray",
      });

      bestTrajListener.subscribe((message: any) => {
        if (message) {
          if (connRef.current && connRef.current.open) {
            connRef.current.send({
              topic: "traj",
              data: bestTrajectory(message.markers),
            });
          }
        }
      });

      //订阅参考中心线/visualization/reference_central_lines
      const referenceCentralLinesListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/visualization/reference_central_lines",
        messageType: "visualization_msgs/MarkerArray",
      });

      referenceCentralLinesListener.subscribe((message: any) => {
        if (message) {
          if (connRef.current && connRef.current.open) {
            connRef.current.send({
              topic: "CentralLines",
              data: simplifyMarkers_tarj(message.markers),
            });
          }
        }
      });

      //订阅话题polygon_path消息类型visualization_msgs/MarkerArray
      // const polygonPathListener = new ROSLIB.Topic({
      //   ros: rosRef.current,
      //   name: "/polygon_path",
      //   messageType: "visualization_msgs/MarkerArray",
      // });

      // polygonPathListener.subscribe((message: any) => {
      //   if (message) {
      //     if (connRef.current && connRef.current.open) {
      //       connRef.current.send({
      //         topic: "polygon_path",
      //         data: simplifyPolygon_path(message.markers),
      //       });
      //     }
      //   }
      // });

      //订阅道路边界/visulization/path_boundary
      const pathBoundaryListener = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/visulization/path_boundary",
        messageType: "visualization_msgs/MarkerArray",
      });

      pathBoundaryListener.subscribe((message: any) => {
        if (message) {
          if (connRef.current && connRef.current.open) {
            connRef.current.send({
              topic: "path_boundary",
              data: simplifyMarkers_boundary(message.markers),
            });
          }
        }
      });

      //订阅可行驶宽度：/visualization/ll_text
      // const llTextListener = new ROSLIB.Topic({
      //   ros: rosRef.current,
      //   name: "/visualization/ll_text",
      //   messageType: "visualization_msgs/Marker",
      // });

      // llTextListener.subscribe((message: any) => {
      //   if (message) {
      //     if (connRef.current && connRef.current.open) {
      //       // console.log("ll_text message.text", message.text);
      //       passableWidthRef.current = message.text;
      //     }
      //   }
      // });

      //订阅可行驶长度：/visualization/lon_text
      // const lonTextListener = new ROSLIB.Topic({
      //   ros: rosRef.current,
      //   name: "/visualization/lon_text",
      //   messageType: "visualization_msgs/Marker",
      // });

      // lonTextListener.subscribe((message: any) => {
      //   if (message) {
      //     if (connRef.current && connRef.current.open) {
      //       passableLengthRef.current = message.text;
      //     }
      //   }
      // });

      const peerConnection = connRef.current!
        .peerConnection as RTCPeerConnection;

      const collectRTT = async () => {
        const stats = await peerConnection.getStats();
        stats.forEach((report) => {
          if (report.type === "candidate-pair") {
            const rtt = report.currentRoundTripTime;
            if (rtt !== undefined) {
              setLatencyRTT(rtt);
              rttArray.push(rtt); // 添加 RTT 值到数组中

              if (rttArray.length >= maxRTTArrayLength) {
                // 如果 RTT 数组长度达到设定值，发送并重置
                sendRTTSequence(rttArray);
                rttArray = []; // 重置数组
              }
            }
          }
        });
      };

      let animationRTTId: number;

      const requestAnimationRTT = () => {
        collectRTT();
        animationRTTId = requestAnimationFrame(requestAnimationRTT);
      };

      requestAnimationRTT();

      return () => {
        imageListener.unsubscribe();

        if (mediaConnectionRef.current) {
          mediaConnectionRef.current.close();
          mediaConnectionRef.current = null;
        }
        feedbackListener.unsubscribe();
        steerListener.unsubscribe();
        // obstaclesListener.unsubscribe();
        localizationListener.unsubscribe();
        // trajListener.unsubscribe();
        bestTrajListener.unsubscribe();
        referenceCentralLinesListener.unsubscribe();
        cancelAnimationFrame(animationRTTId);
      };
    }
  }, [connected]);

  //鱼眼相机话题
  useEffect(() => {
    if (rosRef.current) {
      //切换视角
      if (imageListenerRef.current) {
        imageListenerRef.current.unsubscribe();
      }

      imageListenerRef.current = new ROSLIB.Topic({
        ros: rosRef.current,
        name: receivedCamera,
        messageType: "sensor_msgs/CompressedImage",
      });

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

  useEffect(() => {
    if (!rosRef.current) return; // 如果 rosRef.current 不存在，直接返回

    if (assistive_mode) {
      // 发布开启辅助模式的消息
      const taskIdMessage = new ROSLIB.Message({
        data: 0,
      });

      const taskIdTopic = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/planning/task_id",
        messageType: "std_msgs/Int32",
      });

      taskIdTopic.publish(taskIdMessage);

      const startUpModeMessage = new ROSLIB.Message({
        data: 1,
      });

      const startUpModeTopic = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/planning/start_up_mode",
        messageType: "std_msgs/Int32",
      });

      startUpModeTopic.publish(startUpModeMessage);

      const autoDriveMessage = new ROSLIB.Message({
        data: true,
      });

      const autoDriveTopic = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/rock_can/auto_drive",
        messageType: "std_msgs/Bool",
      });

      autoDriveTopic.publish(autoDriveMessage);
    } else {
      // 发布关闭辅助模式的消息
      const autoDriveMessage = new ROSLIB.Message({
        data: false,
      });

      const autoDriveTopic = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/rock_can/auto_drive",
        messageType: "std_msgs/Bool",
      });

      autoDriveTopic.publish(autoDriveMessage);

      // 发布控制话题
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
        if (connected && connRef.current && !assistive_mode) {
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
              gear_num = 3;
              break;
            case "p":
              gear_num = 4;
              break;
            default:
              gear_num = 3;
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
          // console.log("speedDataMessage 发布话题", speedDataMessage);

          const brakeDataMessage = new ROSLIB.Message({
            enable_auto_brake: true,
            deceleration: controlDataRef.current.brake * -5,
          });

          brakeTopic.publish(brakeDataMessage);
        }
      };

      let animationFrameId: number;

      const requestAnimationFun = () => {
        sendControlData();
        animationFrameId = requestAnimationFrame(requestAnimationFun);
      };

      requestAnimationFun();

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [assistive_mode, connected]);

  // 发送 RTT 时延数据到 ROS
  const sendRTTSequence = (rttArray: number[]) => {
    if (rosRef.current && connected) {
      const rttMessage = new ROSLIB.Message({
        data: rttArray, // 发送 RTT 数据
      });

      const delayTopic = new ROSLIB.Topic({
        ros: rosRef.current,
        name: "/delay_time", // RTT 延时话题
        messageType: "std_msgs/Float64MultiArray", // 消息类型
      });

      delayTopic.publish(rttMessage); // 发布消息
    }
  };

  return (
    <div className="container my-auto flex flex-row gap-3">
      <Card className="grow">
        <CardHeader>
          <CardTitle>视频画面</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas ref={canvasRef} className="w-full aspect-[25/9]" />
        </CardContent>
      </Card>
      <Card className="min-w-96">
        <CardHeader>
          <CardTitle>车端信息</CardTitle>
        </CardHeader>
        <CardContent>
          <p>车端ID: {peerId}</p>
          <p>
            状态:{" "}
            <span className={connected ? "text-green-500" : "text-rose-500"}>
              {connected ? "已连接" : "未连接"}
            </span>
          </p>
          <p>转向: {Math.floor(steer_angle ?? 0)}°</p>
          {/* <p>转向：{Math.floor(showControl.rotation)}°</p> */}
          <p>刹车: {Math.floor(showControl.brake * 100)}%</p>
          <p>油门: {Math.floor(showControl.throttle * 100)}%</p>
          <p>挡位: {showControl.gear}</p>
          <p>速度：{(((feedback_sp ?? 0) * 3.6) / 100).toFixed(2)} km/h</p>
          <p>摄像头：{receivedCamera}</p>
          <p>往返延迟：{`${latencyRTT * 1000} ms`}</p>
          <p>辅助模式：{assistive_mode ? "开" : "关"}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Car;
