import React from "react";
import Image from "next/image";

export default function Wheel({ rotation }: { rotation: number }) {
  return (
    <div
      className="wheel-container"
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center",
        width: "80px", // 设置图片容器的宽度
        height: "80px", // 设置图片容器的高度
      }}
    >
      <Image
        src="/wheel.png"
        alt="Steering Wheel"
        width={80} // 设置图像宽度
        height={80} // 设置图像高度
        style={{
          objectFit: "contain", // 确保图片按比例缩放
        }}
        priority // 如果这是页面上重要的图片，可以设置为优先加载
      />
    </div>
  );
}
