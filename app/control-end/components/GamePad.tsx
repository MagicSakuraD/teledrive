"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CircleAlert } from "lucide-react";
import Pedal from "./Pedal";
import GearShift from "./GearShift";

import Gauge from "./Gauge";
import { Button } from "@/components/ui/button";
import SteerWheel from "./SteerWheel";

interface GamepadProps {
  axes: {
    rotation: number;
    brake: number;
    throttle: number;
  };
  setAxes: React.Dispatch<
    React.SetStateAction<{
      rotation: number;
      brake: number;
      throttle: number;
    }>
  >;
  currentGear: string;
  setCurrentGear: React.Dispatch<React.SetStateAction<string>>;
  feedbackSpeed: number;
}

const Gamepad: React.FC<GamepadProps> = ({
  axes,
  setAxes,
  currentGear,
  setCurrentGear,
  feedbackSpeed,
}) => {
  const [gamepad, setGamepad] = useState<Gamepad | null>(null);
  const [isGamepadSupported, setIsGamepadSupported] = useState<boolean>(true);
  const [buttons, setButtons] = useState<boolean[]>([]);

  const reconnectGamepad = () => {
    const gamepads = navigator.getGamepads();
    for (const gp of gamepads) {
      if (gp && gp.id.includes("G923")) {
        setGamepad(gp);
        console.log("Gamepad reconnected:", gp);
        break;
      }
    }
  };

  useEffect(() => {
    // Check if the Gamepad API is supported
    if ("getGamepads" in navigator) {
      setIsGamepadSupported(true);

      const connectHandler = (event: GamepadEvent) => {
        if (event.gamepad.id.includes("G923")) {
          setGamepad(event.gamepad);
          console.log("Gamepad connected:", event.gamepad);
        }
      };

      const disconnectHandler = (event: GamepadEvent) => {
        if (event.gamepad === gamepad) {
          setGamepad(null);
          console.log("Gamepad disconnected:", event.gamepad);
        }
      };

      window.addEventListener("gamepadconnected", connectHandler);
      window.addEventListener("gamepaddisconnected", disconnectHandler);

      return () => {
        window.removeEventListener("gamepadconnected", connectHandler);
        window.removeEventListener("gamepaddisconnected", disconnectHandler);
      };
    } else {
      setIsGamepadSupported(false);
    }
  }, [gamepad]);

  useEffect(() => {
    const updateGamepadState = () => {
      if (gamepad) {
        const gp = navigator.getGamepads()[gamepad.index];
        if (gp) {
          // Update axes state
          const newAxes = {
            rotation: Math.round((gp.axes[0] || 0) * 450), // Steering rotation
            brake: parseFloat(((1 - gp.axes[1]) / 2 || 0).toFixed(2)), // Brake
            throttle: parseFloat(((1 - gp.axes[2]) / 2 || 0).toFixed(2)), // Throttle
          };
          setAxes(newAxes);

          // Update buttons state
          const newButtons = [
            gp.buttons[0],
            gp.buttons[1],
            gp.buttons[2],
            gp.buttons[3],
          ].map((button) => button.pressed);
          setButtons(newButtons);

          // Update current gear based on buttons state
          if (newButtons[0]) {
            setCurrentGear("P"); // P - Parking
          } else if (newButtons[1]) {
            setCurrentGear("R"); // R - Reverse
          } else if (newButtons[2]) {
            setCurrentGear("N"); // N - Neutral
          } else if (newButtons[3]) {
            setCurrentGear("D"); // D - Drive
          }
        }
      }
      requestAnimationFrame(updateGamepadState);
    };

    updateGamepadState();
  }, [gamepad]);

  return (
    <div className="flex flex-row items-center justify-between bg-transparent w-full h-full">
      {isGamepadSupported ? (
        <>
          {gamepad ? (
            <div className="flex flex-row justify-between gap-3 w-full items-center">
              <Pedal brake={axes.brake} throttle={axes.throttle} />

              <div>
                <div className="text-sm text-muted-foreground">转角</div>
                <div className="text-xl font-bold tabular-nums leading-none w-5">
                  {axes.rotation}°
                </div>
              </div>

              <SteerWheel rotation={axes.rotation} />
              <GearShift gear={currentGear} />
              <Gauge
                value={parseFloat((feedbackSpeed * 0.036).toFixed(1))}
                min={0}
                max={100}
                label="Speed"
                units="km/h"
              />
            </div>
          ) : (
            <div className="flex flex-row items-center justify-center w-full h-20">
              <div className="text-foreground/80 flex flex-row gap-1 items-center justify-center w-full mb-2">
                <CircleAlert color="#ea580c" className="w-5 h-5" />
                未连接游戏手柄
                <Button onClick={reconnectGamepad} className="ml-4">
                  重连手柄
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <CardHeader className="text-xl">此浏览器不支持游戏手柄API</CardHeader>
      )}
    </div>
  );
};

export default Gamepad;
