import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

let isRecording = false;
let recordingProgress = 0;
let onProgressCallback = null;

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
 * @returns {Promise<Blob>} MP4 blob
 */
export const recordMP4 = async (options, renderFrame, params) => {
  const {
    width = 1920,
    height = 1080,
    fps = 30,
    duration = 5,
    quality = 0.8,
  } = options;

  isRecording = true;
  recordingProgress = 0;

  const totalFrames = Math.floor(fps * duration);
  const frameDuration = 1000000 / fps; // microseconds

  // Create offscreen canvas for rendering
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

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

      // Render frame to offscreen canvas
      await renderFrame(ctx, canvas, currentTime, params);

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
    encoder.close();
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
