function drawArc(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  startAngle: number,
  endAngle: number,
  radius: number,
  isRight: boolean
) {
  // Create a gradient from the start to the end of the arc
  const gradient = ctx.createLinearGradient(
    centerX + Math.cos(startAngle) * radius,
    centerY + Math.sin(startAngle) * radius,
    centerX + Math.cos(endAngle) * radius,
    centerY + Math.sin(endAngle) * radius
  );

  // Define gradient stops
  gradient.addColorStop(0, "rgba(250, 245, 255, 0)"); // Start thin
  gradient.addColorStop(0.4, "rgba(250, 245, 255, 1)"); // Middle thick
  gradient.addColorStop(0.6, "rgba(250, 245, 255, 1)"); // Middle thick
  gradient.addColorStop(1, "rgba(250, 245, 255, 0)"); // End thin

  ctx.beginPath();
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 7; // Set maximum line width at the center
  ctx.lineCap = "round"; // Smooth line ends

  ctx.arc(
    centerX,
    centerY,
    radius,
    startAngle,
    endAngle,
    isRight ? false : true
  );

  ctx.stroke();
}

export default function drawGuideLine(
  x: number,
  y: number,
  angle: number,
  ctx: CanvasRenderingContext2D,
  gear: string
) {
  const wheelbase = 185.5; // 轴距
  const width = 130.2; // 车辆宽度


  angle = angle === 0 ? 0.01 : angle;//避免angle为0时
  // 将角度转换为弧度

  const angleRad = (angle * Math.PI) / 180;

  // 计算转向半径（到后轴中心）
  const turningRadius = wheelbase / Math.tan(Math.abs(angleRad));
  const frontTurnRadius = wheelbase / Math.sin(Math.abs(angleRad));

  // 计算内侧和外侧辅助线的半径
  const innerRadius = turningRadius - width / 2 // 防止负值
  const outerRadius = turningRadius + width / 2;
  const frontouterRadius = frontTurnRadius + (width / 2) * Math.cos(angleRad);
  const frontinnerRadius = frontTurnRadius - (width / 2) * Math.cos(angleRad);
  const arcAngle = 700 / frontouterRadius;

  if (gear === "R") {
    // 计算转向中心
    const turnCenterY = y;
    const turnRight = angleRad >= 0;
    const turnCenterX = x + (turnRight ? turningRadius : -turningRadius);

    const startAngle = turnRight ? Math.PI : 0;
    const endAngle = turnRight ? startAngle - arcAngle : arcAngle;
    const frontStartAngle = turnRight ? Math.PI + angleRad : angleRad;
    const frontEndAngle = turnRight
      ? frontStartAngle - arcAngle
      : frontStartAngle + arcAngle;
    // 绘制内侧辅助线
    drawArc(
      ctx,
      turnCenterX,
      turnCenterY,
      startAngle,
      endAngle,
      innerRadius,
      !turnRight
    );
    if (Math.abs(angleRad) < 0.6) {
      // 绘制外侧辅助线
      drawArc(
        ctx,
        turnCenterX,
        turnCenterY,
        startAngle,
        endAngle,
        outerRadius,
        !turnRight
      );
    } else {
      // 绘制前轮外侧辅助线
      drawArc(
        ctx,
        turnCenterX,
        turnCenterY,
        frontStartAngle,
        frontEndAngle,
        frontouterRadius,
        !turnRight
      );
    }
  } else if (gear === "D") {
    // 计算转向中心
    const turnCenterY = y;
    const turnRight = angleRad >= 0;
    const turnCenterX = x + (turnRight ? turningRadius : -turningRadius);
    const startAngle = turnRight ? angleRad + Math.PI : angleRad;
    const endAngle = turnRight ? startAngle + arcAngle : startAngle - arcAngle;
    const backStartAngle = turnRight ? Math.PI : 0;
    const backEndAngle = turnRight ? backStartAngle + arcAngle : -arcAngle;

    drawArc(
      ctx,
      turnCenterX,
      turnCenterY,
      startAngle,
      endAngle,
      frontouterRadius,
      turnRight
    );

    if (Math.abs(angleRad) > 0.6) {
      // 绘制后轮内侧辅助线
      drawArc(
        ctx,
        turnCenterX,
        turnCenterY,
        backStartAngle,
        backEndAngle,
        innerRadius,
        turnRight
      );
    } else {
      // 绘制前轮内侧辅助线
      drawArc(
        ctx,
        turnCenterX,
        turnCenterY,
        startAngle,
        endAngle,
        frontinnerRadius,
        turnRight
      );
    }
  }
}
