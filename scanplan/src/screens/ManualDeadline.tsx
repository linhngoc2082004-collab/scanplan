import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import BackArrow from '../components/BackArrow';
import OrangeButton from '../components/OrangeButton';
import { createDeadline } from '../lib/backendApi';

const DEADLINE_TYPES = [
  'assignment',
  'exam',
  'quiz',
  'presentation',
  'test',
  'project',
  'paper',
  'other',
];

export default function ManualDeadline() {
  const navigate = useNavigate();
  const location = useLocation();

  const bannerMessage = (location.state as any)?.message || '';

  const [title, setTitle] = useState('');
  const [courseName, setCourseName] = useState('');
  const [deadlineType, setDeadlineType] = useState('assignment');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Clear messages when user starts typing
  useEffect(() => {
    if (error) setError('');
    if (success) setSuccess('');
  }, [title, courseName, deadlineType, dueDate, dueTime]);

  const handleSubmit = async () => {
    // Validate required fields
    if (!title.trim()) {
      setError('Please enter a deadline title.');
      return;
    }
    if (!dueDate) {
      setError('Please select a due date.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Build the due_date with the selected time, using UTC to prevent timezone shifts
      const dueDateTime = `${dueDate}T${dueTime || '23:59'}:00Z`;

      const saved = await createDeadline({
        title: title.trim(),
        course_name: courseName.trim() || undefined,
        deadline_type: deadlineType,
        due_date: dueDateTime,
      });

      setSuccess(`✅ "${saved.title}" has been saved!`);

      // Reset form
      setTitle('');
      setCourseName('');
      setDeadlineType('assignment');
      setDueDate('');
      setDueTime('23:59');

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save deadline. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <BackArrow to="/upload" />

      <h1 className="text-2xl font-bold text-gray-900 mb-4">Add Deadline Manually</h1>

      {bannerMessage && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {bannerMessage}
        </div>
      )}

      <p className="text-gray-600 text-base mb-6">
        Fill in the details below to add a deadline to your calendar.
      </p>

      {/* Deadline Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Deadline Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Final Project Submission"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:border-brand"
        />
      </div>

      {/* Course Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Course Name
        </label>
        <input
          type="text"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="e.g. CS101 - Introduction to Programming"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:border-brand"
        />
      </div>

      {/* Deadline Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Deadline Type
        </label>
        <select
          value={deadlineType}
          onChange={(e) => setDeadlineType(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:border-brand bg-white"
        >
          {DEADLINE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Due Date */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Due Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:border-brand"
        />
      </div>

      {/* Due Time (optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Due Time <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="time"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:border-brand"
        />
        <p className="text-xs text-gray-400 mt-1">
          Defaults to 11:59 PM if not specified.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      <OrangeButton onClick={handleSubmit} disabled={saving || !title || !dueDate}>
        {saving ? 'Saving...' : 'Save Deadline'}
      </OrangeButton>
    </Layout>
  );
}