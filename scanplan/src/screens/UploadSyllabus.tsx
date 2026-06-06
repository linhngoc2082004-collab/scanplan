import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BackArrow from '../components/BackArrow';
import OrangeButton from '../components/OrangeButton';
import { uploadSyllabus } from '../lib/backendApi';

export default function UploadSyllabus() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      {/* Action buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleDropZoneClick}
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

      {/* Drag-and-drop zone */}
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <OrangeButton onClick={handleUpload} disabled={!selectedFile || loading}>
        {loading ? 'Uploading...' : selectedFile ? `Upload ${selectedFile.name}` : 'Upload File'}
      </OrangeButton>
    </Layout>
  );
}
