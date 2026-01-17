import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

let isRecording = false;
let recordingProgress = 0;
let onProgressCallback = null;

/**
 * Ensure font is loaded for Canvas 2D rendering
 */
async function ensureFontLoaded(fontName) {
  try {
    // Check if font is already loaded
    const testString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const loaded = document.fonts.check(`16px "${fontName}"`, testString);

    if (!loaded) {
      // Wait for font to load (with timeout)
      await Promise.race([
        document.fonts.load(`16px "${fontName}"`, testString),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Font load timeout')), 5000)
        )
      ]);
    }

    return true;
  } catch (error) {
    console.warn(`Font "${fontName}" may not be fully loaded:`, error);
    return false;
  }
}

export const getRecordingState = () => ({
  isRecording,
  progress: recordingProgress,
});

export const setProgressCallback = (callback) => {
  onProgressCallback = callback;
};

/**
 * Record canvas animation to MP4
 * @param {Object} options Recording options
 * @param {Function} renderFrame Function that renders a single frame
 * @param {Object} params Current parameters
 * @param {number} previewWidth Width of the preview canvas (for scale calculation)
 * @returns {Promise<Blob>} MP4 blob
 */
export const recordMP4 = async (options, renderFrame, params, previewWidth = 800) => {
  const {
    width = 1920,
    height = 1080,
    fps = 30,
    duration = 5,
    quality = 0.8,
  } = options;

  isRecording = true;
  recordingProgress = 0;

  // Ensure font is loaded before rendering
  await ensureFontLoaded(params.font);

  // Calculate export scale based on preview vs export resolution
  const exportScale = width / previewWidth;

  const totalFrames = Math.floor(fps * duration);
  const frameDuration = 1000000 / fps; // microseconds

  // Create offscreen canvas for rendering
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', {
    alpha: params.backgroundTransparent,
    desynchronized: true, // Performance optimization
  });

  // Calculate bitrate based on quality (1-10 Mbps range)
  const bitrate = Math.floor(1000000 + quality * 9000000);

  // Initialize muxer
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width,
      height,
    },
    fastStart: 'in-memory',
  });

  // Check for VideoEncoder support
  if (typeof VideoEncoder === 'undefined') {
    isRecording = false;
    throw new Error('VideoEncoder API not supported. Please use Chrome or Edge.');
  }

  // Create video encoder
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (e) => {
      console.error('Encoder error:', e);
    },
  });

  // Configure encoder
  encoder.configure({
    codec: 'avc1.640028', // H.264 High Profile
    width,
    height,
    bitrate,
    framerate: fps,
  });

  // Calculate time step to match live preview animation speed
  // Live preview runs at ~60fps and advances time by globalSpeed each frame
  // To match the same animation speed at different fps, we scale accordingly
  let currentTime = 0;
  const timeStep = params.globalSpeed * (60 / fps);

  try {
    for (let frame = 0; frame < totalFrames; frame++) {
      // Update progress
      recordingProgress = frame / totalFrames;
      if (onProgressCallback) {
        onProgressCallback(recordingProgress);
      }

      // Render frame to offscreen canvas with export scale
      await renderFrame(ctx, canvas, currentTime, params, exportScale);

      // Create video frame
      const videoFrame = new VideoFrame(canvas, {
        timestamp: frame * frameDuration,
        duration: frameDuration,
      });

      // Encode frame
      encoder.encode(videoFrame, { keyFrame: frame % (fps * 2) === 0 });
      videoFrame.close();

      // Advance time
      currentTime += timeStep;

      // Yield to UI thread periodically
      if (frame % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Flush encoder
    await encoder.flush();
    encoder.close();

    // Finalize muxer
    muxer.finalize();

    // Get the MP4 data
    const { buffer } = muxer.target;
    const blob = new Blob([buffer], { type: 'video/mp4' });

    isRecording = false;
    recordingProgress = 1;

    return blob;
  } catch (error) {
    isRecording = false;
    // Only close if not already closed
    if (encoder.state !== 'closed') {
      encoder.close();
    }
    throw error;
  }
};

/**
 * Download blob as file
 */
export const downloadBlob = (blob, filename = 'wave-type.mp4') => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Cancel ongoing recording
 */
export const cancelRecording = () => {
  isRecording = false;
};
