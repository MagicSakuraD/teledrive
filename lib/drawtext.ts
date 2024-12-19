export default function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number = 60,
  fontColor: string = "#be123c",
  fontFamily: string = "Arial"
) {
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = fontColor;
  ctx.fillText(text, x, y);
}
