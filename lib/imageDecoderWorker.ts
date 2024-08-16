// imageDecoderWorker.ts
self.onmessage = (event: MessageEvent) => {
  const { data, id } = event.data;

  const blob = new Blob([data], { type: "image/jpeg" });
  const url = URL.createObjectURL(blob);

  // Send the URL back to the main thread
  self.postMessage({ url, id });
};
