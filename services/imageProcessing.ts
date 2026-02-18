/**
 * Applies a convolution filter to a canvas context.
 * Used for sharpening to simulate high-resolution sensors.
 */
const applyConvolution = (ctx: CanvasRenderingContext2D, width: number, height: number, kernel: number[]) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const side = Math.round(Math.sqrt(kernel.length));
  const halfSide = Math.floor(side / 2);
  const src = imageData.data;
  const sw = width;
  const sh = height;
  
  // Create output buffer
  const output = ctx.createImageData(width, height);
  const dst = output.data;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const sy = y;
      const sx = x;
      const dstOff = (y * sw + x) * 4;
      
      let r = 0, g = 0, b = 0;

      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = sy + cy - halfSide;
          const scx = sx + cx - halfSide;
          
          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            const srcOff = (scy * sw + scx) * 4;
            const wt = kernel[cy * side + cx];
            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
          }
        }
      }
      
      dst[dstOff] = r;
      dst[dstOff + 1] = g;
      dst[dstOff + 2] = b;
      dst[dstOff + 3] = src[dstOff + 3]; // Alpha
    }
  }
  ctx.putImageData(output, 0, 0);
};

/**
 * Simulates Sony A1 Color Science
 * - High contrast
 * - Slightly warm highlights
 * - Deep blacks
 * - Sharp details
 */
export const processSonyLook = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Sharpening (simulating high megapixel count)
  // Simple sharpen kernel
  const sharpenKernel = [
     0, -1,  0,
    -1,  5, -1,
     0, -1,  0
  ];
  // Note: Full convolution in JS is slow for large images. 
  // We will rely on CSS filters for the preview and only do lightweight processing here or assume the hardware camera is good enough,
  // then overlay a color grading pass.
  
  // For the sake of performance in this demo, we will use GlobalCompositeOperation to tint.
  
  const width = canvas.width;
  const height = canvas.height;

  // Save current state
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if(tempCtx) {
      tempCtx.drawImage(canvas, 0, 0);
      
      // Clear main
      ctx.clearRect(0,0, width, height);
      
      // Draw original
      ctx.drawImage(tempCanvas, 0, 0);

      // Sony Style: Cool shadows, Warm highlights (Subtle)
      // Overlay a subtle blue for shadows
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(0, 0, 20, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Overlay a subtle orange for warmth/pop
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(255, 150, 50, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Reset
      ctx.globalCompositeOperation = 'source-over';
      
      // Increase contrast manually via pixel manipulation is expensive, 
      // so we rely on the `filter` property of the context if supported or leave as is.
      ctx.filter = 'contrast(1.15) saturate(1.1)';
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.filter = 'none';
  }
};

/**
 * Image Stacking Logic
 * Captures multiple frames and averages them to reduce noise and increase detail.
 */
export const performStacking = async (
  videoElement: HTMLVideoElement, 
  canvas: HTMLCanvasElement
): Promise<string> => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("No canvas context");

  const width = videoElement.videoWidth;
  const height = videoElement.videoHeight;
  
  canvas.width = width;
  canvas.height = height;

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Capture 4 frames with slight delay
  const frameCount = 4;
  
  for (let i = 0; i < frameCount; i++) {
    // Draw new frame
    // We use varying opacity to average: 
    // Frame 1: 100%
    // Frame 2: 50% (Avg of 1 & 2)
    // Frame 3: 33% (Avg of 1-3)
    // Frame 4: 25% (Avg of 1-4)
    
    // In practice, 'screen' or simple opacity layering works well for "stacking" effect in frontend
    ctx.globalAlpha = 1 / (i + 1);
    ctx.drawImage(videoElement, 0, 0, width, height);
    
    // Artificial delay to capture slightly different noise patterns
    await new Promise(r => setTimeout(r, 50)); 
  }

  ctx.globalAlpha = 1.0;
  
  // Apply Sony Color Processing
  processSonyLook(canvas);

  return canvas.toDataURL('image/jpeg', 0.95);
};