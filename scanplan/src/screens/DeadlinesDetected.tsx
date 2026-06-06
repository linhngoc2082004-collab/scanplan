import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import BackArrow from '../components/BackArrow';
import DeadlineCard from '../components/DeadlineCard';
import OrangeButton from '../components/OrangeButton';
import { createDeadline, updateDeadline, deleteDeadline } from '../lib/backendApi';
import type { Deadline } from '../types';

export default function DeadlinesDetected() {
  const navigate = useNavigate();
  const location = useLocation();

  // Deadlines from the upload result (passed via location state)
  const uploadedDeadlines = (location.state as any)?.deadlines || [];

  // Convert backend deadlines to frontend format
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    // Convert uploaded deadlines to the frontend Deadline format
    const formatted: Deadline[] = uploadedDeadlines.map((dl: any, index: number) => {
      const [, monthNumber, dayNumber] = dl.due_date.slice(0, 10).split('-').map(Number);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[monthNumber - 1];
      const day = dayNumber.toString();
      return {
        id: dl.id || `temp-${index}`,
        title: dl.title,
        date: `${month} ${day}`,
        month,
        day,
        course_name: dl.course_name,
        deadline_type: dl.deadline_type,
        due_date: dl.due_date,
      };
    });
    setDeadlines(formatted);
  }, [uploadedDeadlines]);

  const handleStartEdit = (id: string, title: string, date: string) => {
    setEditingId(id);
    setEditTitle(title);
    setEditDate(date);
  };

  const handleSaveEdit = async () => {
    if (editingId === null) return;

    let dueDate: string | undefined;
    const parsedDate = new Date(`${editDate} ${new Date().getFullYear()}`);
    if (!Number.isNaN(parsedDate.getTime())) {
      dueDate = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}T12:00:00Z`;
    }

    if (!editingId.startsWith('temp-')) {
      try {
        await updateDeadline(editingId, { title: editTitle, ...(dueDate ? { due_date: dueDate } : {}) });
      } catch (err: any) {
        window.alert(err.message || 'Failed to update deadline.');
        return;
      }
    }

    setDeadlines((prev) =>
      prev.map((d) =>
        d.id === editingId ? { ...d, title: editTitle, date: editDate, due_date: dueDate || d.due_date } : d
      )
    );
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!id.startsWith('temp-')) {
      try {
        await deleteDeadline(id);
      } catch (err: any) {
        window.alert(err.message || 'Failed to delete deadline.');
        return;
      }
    }
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
  };

  const handleAddDeadline = async () => {
    if (!newTitle || !newDate) return;

    const parsedDate = new Date(`${newDate} ${new Date().getFullYear()}`);
    if (Number.isNaN(parsedDate.getTime())) {
      window.alert('Please enter a date such as Dec 15.');
      return;
    }

    try {
      const saved = await createDeadline({
        title: newTitle,
        deadline_type: 'assignment',
        due_date: `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}T12:00:00Z`,
      });
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [, savedMonth, savedDay] = saved.due_date.slice(0, 10).split('-').map(Number);
      const newDeadline: Deadline = {
        id: saved.id,
        title: saved.title,
        date: `${monthNames[savedMonth - 1]} ${savedDay}`,
        month: monthNames[savedMonth - 1],
        day: savedDay.toString(),
        course_name: saved.course_name,
        deadline_type: saved.deadline_type,
        due_date: saved.due_date,
      };
      setDeadlines((prev) => [...prev, newDeadline]);
    } catch (err: any) {
      window.alert(err.message || 'Failed to add deadline.');
      return;
    }
    setNewTitle('');
    setNewDate('');
    setShowAddForm(false);
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <Layout>
      <BackArrow to="/upload" />

      {/* Success indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Deadlines Detected!</h1>
      </div>

      <p className="text-gray-500 text-sm mb-6">
        ScanPlan found {deadlines.length} deadlines in your syllabus.
      </p>

      {/* Deadline cards */}
      <div className="mb-8">
        {deadlines.map((deadline) => (
          <div key={deadline.id} className="relative group">
            <DeadlineCard
              deadline={deadline}
              isEditing={editingId === deadline.id}
              onStartEdit={() => handleStartEdit(deadline.id, deadline.title, deadline.date)}
              editTitle={editTitle}
              editDate={editDate}
              onEditTitleChange={setEditTitle}
              onEditDateChange={setEditDate}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
            />
            {/* Delete button */}
            <button
              onClick={() => handleDelete(deadline.id)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Delete deadline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add new deadline button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-brand hover:text-brand transition-colors mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Add Manual Deadline</span>
        </button>
      )}

      {/* Add new deadline form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="mb-3">
            <label className="block text-sm text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Final Project"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:border-brand"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm text-gray-700 mb-1">Date</label>
            <input
              type="text"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              placeholder="e.g. Dec 15"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:border-brand"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddDeadline}
              disabled={!newTitle || !newDate}
              className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors text-sm disabled:opacity-50"
            >
              Add Deadline
            </button>
          </div>
        </div>
      )}

      <OrangeButton onClick={handleContinue}>
        Continue to Dashboard
      </OrangeButton>
    </Layout>
  );
}
