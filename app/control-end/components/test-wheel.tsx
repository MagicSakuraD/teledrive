import React from "react";
import { Slider } from "@/components/ui/slider";

interface TestWheelProps {
  setAxes: React.Dispatch<
    React.SetStateAction<{
      rotation: number;
      brake: number;
      throttle: number;
    }>
  >;
}

const TestWheel: React.FC<TestWheelProps> = ({ setAxes }) => {
  const handleSliderChange = (value: number[]) => {
    // Assuming you want to update the throttle value
    setAxes((prevState) => ({
      ...prevState,
      rotation: value[0], // Update the throttle value based on the slider
    }));
  };

  return (
    <div>
      <Slider
        defaultValue={[0]}
        max={100}
        step={1}
        className="w-96"
        onValueChange={handleSliderChange}
      />
    </div>
  );
};

export default TestWheel;
