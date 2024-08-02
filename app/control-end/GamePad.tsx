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
import Wheel from "./Wheel";
import Pedal from "./Pedal";
import GearShift from "./GearShift";
import CarSpeed from "./CarSpeed";

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
}

const Gamepad: React.FC<GamepadProps> = ({
  axes,
  setAxes,
  currentGear,
  setCurrentGear,
}) => {
  const [gamepad, setGamepad] = useState<Gamepad | null>(null);
  const [isGamepadSupported, setIsGamepadSupported] = useState<boolean>(true);
  const [buttons, setButtons] = useState<boolean[]>([]);

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
    <main>
      <div className="flex flex-row items-center justify-between bg-transparent">
        {isGamepadSupported ? (
          <div>
            {gamepad ? (
              <div>
                <div className="h-96 w-[80rem] flex flex-row justify-between gap-2">
                  <Wheel rotation={axes.rotation} />
                  <Pedal brake={axes.brake} throttle={axes.throttle} />
                  <GearShift gear={currentGear} />
                  <CarSpeed />
                </div>
                <p className="text-sm text-muted-foreground">
                  已连接的游戏手柄: {gamepad.id}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground flex flex-row gap-1 items-center">
                <CircleAlert color="#ea580c" className="w-5 h-5" />
                未连接游戏手柄
              </p>
            )}
          </div>
        ) : (
          <CardHeader className="text-xl">此浏览器不支持游戏手柄API</CardHeader>
        )}
      </div>
    </main>
  );
};

export default Gamepad;
