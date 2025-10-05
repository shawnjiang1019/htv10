// poll-time.ts
export function startVideoTimePolling(callback: (time: number) => void): () => void {
  const interval = setInterval(() => {
    const video = document.querySelector("video");
    if (video) {
      callback(video.currentTime);
    }
  }, 100); // poll every second

  // Return a stop function
  return () => clearInterval(interval);
}
