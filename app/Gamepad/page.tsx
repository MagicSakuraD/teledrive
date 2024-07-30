"use client";
import React, { useEffect, useState } from "react";

const Gamepad = () => {
  const [gamepad, setGamepad] = useState<Gamepad | null>(null);
  const [isGamepadSupported, setIsGamepadSupported] = useState<boolean>(true);
  const [axes, setAxes] = useState<number[]>([]);
  const [buttons, setButtons] = useState<boolean[]>([]);
  const [brake, setBrake] = useState<number | null>(null);
  const [throttle, setThrottle] = useState<number | null>(null);
  const [clutch, setClutch] = useState<number | null>(null);

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
          // Update axes and buttons state
          setAxes(Array.from(gp.axes)); // Create a mutable copy of the readonly array
          setButtons(gp.buttons.map((button) => button.pressed));

          // Assuming axis indices for G923 (these might need adjustments)
          // Typically:
          // Axis 0 and 1 are the left stick
          // Axis 2 is the throttle (right pedal)
          // Axis 3 is the brake (left pedal)
          // Axis 4 is the clutch (middle pedal, if available)

          setThrottle(gp.axes[2]);
          setBrake(gp.axes[3]);
          setClutch(gp.axes[4] || null); // Clutch may not be present in all models

          // Log button and axes states
          gp.buttons.forEach((button, index) => {
            console.log(`Button ${index}: ${button.pressed}`);
          });
          gp.axes.forEach((axis, index) => {
            console.log(`Axis ${index}: ${axis}`);
          });
        }
      }
      requestAnimationFrame(updateGamepadState);
    };

    updateGamepadState();
  }, [gamepad]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {isGamepadSupported ? (
        <div>
          {gamepad ? (
            <div>
              <h2>Connected Gamepad: {gamepad.id}</h2>
              <div>
                <h3>Axes:</h3>
                {axes.map((axis, index) => (
                  <p key={index}>
                    Axis {index}: {axis.toFixed(2)}
                  </p>
                ))}
              </div>
              <div>
                <h3>Buttons:</h3>
                {buttons.map((pressed, index) => (
                  <p key={index}>
                    Button {index}: {pressed ? "Pressed" : "Not pressed"}
                  </p>
                ))}
              </div>
              <div>
                <h3>Pedals:</h3>
                <p>Throttle: {throttle?.toFixed(2)}</p>
                <p>Brake: {brake?.toFixed(2)}</p>
                <p>Clutch: {clutch !== null ? clutch.toFixed(2) : "N/A"}</p>
              </div>
            </div>
          ) : (
            <h2>No Gamepad Connected</h2>
          )}
        </div>
      ) : (
        <h2>Gamepad API is not supported in this browser.</h2>
      )}
    </main>
  );
};

export default Gamepad;
