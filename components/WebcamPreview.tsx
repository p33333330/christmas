import React, { useEffect, useRef } from 'react';

const WebcamPreview: React.FC<{ visible: boolean }> = ({ visible }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    // The main video element is hidden in ThreeCanvas.
    // We need to grab that video element or reuse the stream.
    // However, for simplicity and performance, we'll assume the stream is available globally 
    // or we can query the video element created by ThreeCanvas if we gave it an ID.
    // In ThreeCanvas, we rendered a video with no ID but a ref.
    
    // Better approach: Find the video element in the DOM that ThreeCanvas created.
    // Since ThreeCanvas is mounted, the video element exists.
    const video = document.getElementsByTagName('video')[0];
    const canvas = canvasRef.current;
    
    const draw = () => {
      if (video && canvas && video.readyState >= 2 && visible) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    if (visible) draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visible]);

  return (
    <div 
      className={`absolute bottom-5 right-5 w-[180px] h-[135px] border border-[#d4af37]/50 rounded shadow-2xl bg-black overflow-hidden z-20 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
    >
      <canvas ref={canvasRef} width={320} height={240} className="w-full h-full object-cover scale-x-[-1]" />
      <div id="cam-status-dot" className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-red-900 shadow-[0_0_4px_red] transition-colors duration-200"></div>
    </div>
  );
};

export default WebcamPreview;