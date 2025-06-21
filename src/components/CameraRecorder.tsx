import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Video, VideoOff, Smartphone } from 'lucide-react';
import { Toast } from './Toast';

interface CameraRecorderProps {
  isActive: boolean;
  onRecordingStateChange: (isRecording: boolean) => void;
}

export const CameraRecorder: React.FC<CameraRecorderProps> = ({ 
  isActive, 
  onRecordingStateChange 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [phoneDetected, setPhoneDetected] = useState(false);
  const [showPhoneToast, setShowPhoneToast] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestCameraPermission();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (hasPermission && stream && videoRef.current) {
      // Start phone detection when camera is active
      startPhoneDetection();
    }
    
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [hasPermission, stream]);

  const requestCameraPermission = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240 }, 
        audio: true 
      });
      setStream(mediaStream);
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera permission denied:', error);
      setHasPermission(false);
    }
  };

  const startPhoneDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(() => {
      detectPhone();
    }, 2000); // Check every 2 seconds
  };

  const detectPhone = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple phone detection based on rectangular shapes and edges
    // This is a basic implementation - in production, you'd use ML models
    const phoneDetected = detectRectangularObject(imageData);
    
    if (phoneDetected && !this.phoneDetected) {
      setPhoneDetected(true);
      setShowPhoneToast(true);
      
      // Hide toast after 5 seconds
      setTimeout(() => {
        setShowPhoneToast(false);
      }, 5000);
    } else if (!phoneDetected && this.phoneDetected) {
      setPhoneDetected(false);
    }
  };

  const detectRectangularObject = (imageData: ImageData): boolean => {
    // Simple edge detection algorithm
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let edgeCount = 0;
    let rectangularShapes = 0;

    // Sobel edge detection (simplified)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Get grayscale value
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Simple edge detection
        const gx = -data[((y-1) * width + (x-1)) * 4] + data[((y-1) * width + (x+1)) * 4] +
                   -2 * data[(y * width + (x-1)) * 4] + 2 * data[(y * width + (x+1)) * 4] +
                   -data[((y+1) * width + (x-1)) * 4] + data[((y+1) * width + (x+1)) * 4];
        
        const gy = -data[((y-1) * width + (x-1)) * 4] - 2 * data[((y-1) * width + x) * 4] - data[((y-1) * width + (x+1)) * 4] +
                   data[((y+1) * width + (x-1)) * 4] + 2 * data[((y+1) * width + x) * 4] + data[((y+1) * width + (x+1)) * 4];
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        if (magnitude > 50) { // Edge threshold
          edgeCount++;
        }
      }
    }

    // If we detect a significant number of edges in a rectangular pattern
    // This is a very basic heuristic - real phone detection would use ML
    const edgeRatio = edgeCount / (width * height);
    return edgeRatio > 0.02 && edgeRatio < 0.15; // Typical range for rectangular objects
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    mediaRecorderRef.current = new MediaRecorder(stream);
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      console.log('Recording completed:', blob);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    onRecordingStateChange(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecordingStateChange(false);
    }
  };

  if (hasPermission === null) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            Requesting camera access...
          </p>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="text-center">
          <Camera className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
          <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-3">
            Camera access required for video recording
          </p>
          <button
            onClick={requestCameraPermission}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-300 text-sm"
          >
            Enable Camera
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast for phone detection */}
      {showPhoneToast && (
        <Toast
          message="📱 Mobile phone detected in camera view!"
          type="warning"
          onClose={() => setShowPhoneToast(false)}
        />
      )}

      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-48 object-cover"
        />
        
        {/* Hidden canvas for phone detection */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            REC
          </div>
        )}

        {/* Phone detection indicator */}
        {phoneDetected && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
            <Smartphone className="w-3 h-3" />
            PHONE
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isActive}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isRecording ? (
            <>
              <VideoOff className="w-4 h-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              Start Recording
            </>
          )}
        </button>

        <div className="text-center text-xs text-gray-600 dark:text-gray-400">
          {isRecording ? 'Recording your response...' : 'Click to start video recording'}
          {phoneDetected && (
            <div className="text-orange-600 dark:text-orange-400 mt-1">
              ⚠️ Phone detected in view
            </div>
          )}
        </div>
      </div>
    </div>
  );
};