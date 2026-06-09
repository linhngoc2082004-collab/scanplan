import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BackArrow from '../components/BackArrow';
import OrangeButton from '../components/OrangeButton';
import { uploadSyllabus } from '../lib/backendApi';

export default function UploadSyllabus() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Camera states
  const [cameraMode, setCameraMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState('');

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraMode(false);
    setCapturedImage(null);
    setCameraError('');
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setCameraMode(true);
      // Attach stream to video element after render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 0);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. You can upload a file or add deadlines manually instead.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device. Please upload a file or add deadlines manually.');
      } else {
        setCameraError('Could not access the camera. Please upload a file or add deadlines manually.');
      }
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
  };

  const retakeImage = () => {
    setCapturedImage(null);
  };

  const confirmImage = () => {
    // Stop camera
    stopCamera();
    // Guide user to manual entry
    navigate('/manual-deadline', {
      state: {
        fromCamera: true,
        message: 'Photo captured. Since OCR is not available, please enter your deadlines manually below.',
      },
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    // If camera is already active, don't re-start
    if (!cameraMode) {
      startCamera();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await uploadSyllabus(selectedFile);
      // Navigate to extracting screen with the result data
      navigate('/extracting', {
        state: {
          deadlines: result.deadlines,
          message: result.message,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <BackArrow to="/dashboard" />

      <h1 className="text-2xl font-bold text-gray-900 mb-4">Upload Your Syllabus</h1>

      <p className="text-gray-600 text-base mb-6">
        Upload your course syllabus and ScanPlan will automatically scan it for deadlines, exam dates, and assignment due dates.
      </p>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.docx,.txt"
        className="hidden"
      />

      {/* Action buttons: Take Photo or Upload File */}
      {!cameraMode && (
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleTakePhoto}
            className="flex-1 flex flex-col items-center gap-2 py-4 px-4 border-2 border-gray-200 rounded-lg text-gray-600 hover:border-brand hover:text-brand transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Take Photo</span>
          </button>
          <button
            onClick={handleDropZoneClick}
            className="flex-1 flex flex-col items-center gap-2 py-4 px-4 border-2 border-gray-200 rounded-lg text-gray-600 hover:border-brand hover:text-brand transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Upload File</span>
          </button>
        </div>
      )}

      {/* Camera view */}
      {cameraMode && (
        <div className="mb-6">
          {cameraError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {cameraError}
            </div>
          ) : capturedImage ? (
            <div>
              <img
                src={capturedImage}
                alt="Captured syllabus"
                className="w-full rounded-lg border-2 border-gray-200 mb-3"
              />
              <div className="flex gap-3">
                <button
                  onClick={retakeImage}
                  className="flex-1 py-2 border-2 border-gray-300 rounded-lg text-gray-600 hover:border-brand hover:text-brand transition-colors"
                >
                  Retake
                </button>
                <button
                  onClick={confirmImage}
                  className="flex-1 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
                >
                  Confirm Photo
                </button>
              </div>
            </div>
          ) : (
            <div>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg border-2 border-gray-200 mb-3 bg-black"
              />
              <div className="flex gap-3">
                <button
                  onClick={stopCamera}
                  className="flex-1 py-2 border-2 border-gray-300 rounded-lg text-gray-600 hover:border-red-400 hover:text-red-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={captureImage}
                  className="flex-1 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
                >
                  Capture
                </button>
              </div>
            </div>
          )}
          {/* Hidden canvas for capturing frames */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Drag-and-drop zone (hidden during camera mode) */}
      {!cameraMode && (
        <div
          onClick={handleDropZoneClick}
          className="border-2 border-dashed border-gray-300 rounded-lg py-10 px-4 text-center mb-6 cursor-pointer hover:border-brand transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-3" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
          {selectedFile ? (
            <div>
              <p className="text-brand text-sm font-medium mb-1">
                {selectedFile.name}
              </p>
              <p className="text-gray-400 text-xs">
                {(selectedFile.size / 1024).toFixed(1)} KB — Click to change
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 text-sm mb-1">
                Drag and drop your syllabus here
              </p>
              <p className="text-gray-400 text-xs">
                Supports PDF, DOCX, and TXT files
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {!cameraMode && (
        <>
          <OrangeButton onClick={handleUpload} disabled={!selectedFile || loading}>
            {loading ? 'Uploading...' : selectedFile ? `Upload ${selectedFile.name}` : 'Upload File'}
          </OrangeButton>

          {/* Add Deadline Manually button */}
          <button
            onClick={() => navigate('/manual-deadline')}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-brand hover:text-brand transition-colors text-sm font-medium"
          >
            + Add Deadline Manually
          </button>
        </>
      )}
    </Layout>
  );
}