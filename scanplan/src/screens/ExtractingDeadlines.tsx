import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import BackArrow from '../components/BackArrow';

export default function ExtractingDeadlines() {
  const navigate = useNavigate();
  const location = useLocation();

  const deadlines = (location.state as any)?.deadlines;
  const message = (location.state as any)?.message;

  useEffect(() => {
    if (!deadlines) {
      // No data passed — redirect back to upload
      navigate('/upload');
      return;
    }

    // Short delay so the user sees the processing screen
    const timer = setTimeout(() => {
      navigate('/deadlines', {
        state: {
          deadlines: deadlines,
          message: message,
        },
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate, deadlines, message]);

  return (
    <Layout>
      <BackArrow to="/upload" />

      <div className="flex flex-col items-center justify-center mt-20">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-brand rounded-full animate-spin mb-8" />

        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Extracting Your Deadlines
        </h1>

        <p className="text-gray-500 text-base text-center">
          Analysing your syllabus...
        </p>
      </div>
    </Layout>
  );
}