import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeadlines, logout, updateDeadline } from '../lib/backendApi';
import type { Deadline } from '../types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getStoredDateParts(dueDate: string) {
  const dateOnly = dueDate.slice(0, 10);
  const [year, month, day] = dateOnly.split('-').map(Number);
  return { dateOnly, year, monthIndex: month - 1, day };
}

function formatDeadlineFromBackend(backendDl: any): Deadline {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = getStoredDateParts(backendDl.due_date);
  const month = monthNames[parts.monthIndex];
  const day = parts.day.toString();
  return {
    id: backendDl.id,
    title: backendDl.title,
    date: `${month} ${day}`,
    month,
    day,
    user_id: backendDl.user_id,
    course_name: backendDl.course_name,
    deadline_type: backendDl.deadline_type,
    due_date: backendDl.due_date,
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');

  // Load deadlines from backend on mount
  useEffect(() => {
    async function loadDeadlines() {
      try {
        const data = await getDeadlines();
        const formatted = data.map(formatDeadlineFromBackend);
        setDeadlines(formatted);
      } catch (err) {
        console.error('Failed to load deadlines:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDeadlines();
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      logout();
      navigate('/');
    }
  };

  // Build deadline lookup map using the complete date.
  const deadlineMap = useMemo(() => {
    const map = new Map<string, Deadline>();
    deadlines.forEach((d) => {
      if (d.due_date) {
        const parts = getStoredDateParts(d.due_date);
        map.set(`${parts.year}-${parts.monthIndex}-${parts.day}`, d);
      }
    });
    return map;
  }, [deadlines]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  const handleDayClick = (day: number) => {
    const key = `${currentYear}-${currentMonth}-${day}`;
    if (deadlineMap.has(key)) {
      setSelectedDay(selectedDay === day ? null : day);
    } else {
      setSelectedDay(null);
    }
  };

  const selectedDeadline =
    selectedDay !== null ? deadlineMap.get(`${currentYear}-${currentMonth}-${selectedDay}`) : null;

  const getDaysRemaining = (deadline: Deadline) => {
    const parts = deadline.due_date ? getStoredDateParts(deadline.due_date) : null;
    const deadlineDate = parts
      ? new Date(parts.year, parts.monthIndex, parts.day, 23, 59)
      : new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDays = (days: number) => {
    if (days <= 0) return '0 days';
    if (days === 1) return 'in 1 day';
    return `in ${days} days`;
  };

  const startEdit = (deadline: Deadline) => {
    setEditingId(deadline.id);
    setEditTitle(deadline.title);
    setEditDate(deadline.due_date ? deadline.due_date.slice(0, 10) : '');
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle || !editDate) return;
    try {
      const updated = await updateDeadline(editingId, {
        title: editTitle,
        due_date: `${editDate}T12:00:00Z`,
      });
      setDeadlines((previous) =>
        previous.map((deadline) =>
          deadline.id === editingId ? formatDeadlineFromBackend(updated) : deadline
        )
      );
      setEditingId(null);
      setSelectedDay(null);
    } catch (err: any) {
      window.alert(err.message || 'Failed to update deadline.');
    }
  };

  // Build calendar grid: null = empty cell, number = day of month
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <div className="max-w-[400px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-brand">ScanPlan</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Logout"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* White calendar card */}
        <div className="bg-white rounded-lg p-5 shadow-sm mb-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-1 rounded text-gray-600 hover:text-brand transition-colors"
              aria-label="Previous month"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <span className="text-lg font-semibold text-gray-900">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded text-gray-600 hover:text-brand transition-colors"
              aria-label="Next month"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-gray-400 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar days grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const isToday =
                day === todayDate &&
                currentMonth === todayMonth &&
                currentYear === todayYear;
              const hasDeadline = deadlineMap.has(`${currentYear}-${currentMonth}-${day}`);
              const isSelected = selectedDay === day;

              return (
                <div
                  key={day}
                  className="aspect-square flex flex-col items-center justify-center relative cursor-pointer"
                  onClick={() => handleDayClick(day)}
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ${
                      isToday
                        ? 'bg-brand text-white font-bold'
                        : isSelected
                        ? 'bg-brand/20 text-brand font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {day}
                  </div>
                  {hasDeadline && (
                    <div className="w-1 h-1 rounded-full bg-brand mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Deadline popup */}
          {selectedDeadline && (
            <div className="mt-3 bg-brand/10 border border-brand/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-brand flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedDeadline.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedDeadline.date}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <button
          onClick={() => navigate('/upload')}
          className="w-full bg-white text-brand font-semibold py-3 px-4 rounded-lg mb-3 border-2 border-brand hover:bg-brand/5 transition-colors"
        >
          Upload New Syllabus
        </button>
        <button
          onClick={() => navigate('/manual-deadline')}
          className="w-full bg-white text-brand font-semibold py-3 px-4 rounded-lg mb-3 border-2 border-dashed border-brand/50 hover:bg-brand/5 transition-colors"
        >
          + Add Deadline Manually
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="w-full bg-brand text-white font-semibold py-3 px-4 rounded-lg mb-6 hover:bg-brand/90 transition-colors"
        >
          Reminder Settings
        </button>

        {/* Upcoming Deadlines section */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Upcoming Deadlines
          </h2>

          {loading ? (
            <div className="text-center text-gray-500 py-4">Loading deadlines...</div>
          ) : deadlines.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <p className="mb-4">No deadlines yet. Get started by uploading a syllabus or add a deadline manually.</p>
              <button
                onClick={() => navigate('/upload')}
                className="bg-brand text-white font-semibold py-2 px-6 rounded-lg hover:bg-brand/90 transition-colors"
              >
                Upload Your First Syllabus
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {deadlines.map((deadline) => {
                const daysRemaining = getDaysRemaining(deadline);
                return (
                  <div
                    key={deadline.id}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    {editingId === deadline.id ? (
                      <div className="space-y-2">
                        <input
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-brand"
                        />
                        <input
                          type="date"
                          value={editDate}
                          onChange={(event) => setEditDate(event.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-brand"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 text-sm bg-gray-200 rounded-lg">
                            Cancel
                          </button>
                          <button onClick={saveEdit} className="px-3 py-1 text-sm bg-brand text-white rounded-lg">
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                    <div className="flex items-center gap-3">
                    {/* Calendar icon */}
                    <div className="flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-brand"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    {/* Deadline info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {deadline.title}
                      </p>
                      <p className="text-xs text-gray-500">{deadline.date}</p>
                    </div>

                    {/* Days remaining pill */}
                    <span className="flex-shrink-0 text-xs font-medium text-brand bg-brand/10 px-3 py-1 rounded-full">
                      {formatDays(daysRemaining)}
                    </span>
                    <button
                      onClick={() => startEdit(deadline)}
                      className="flex-shrink-0 text-gray-400 hover:text-brand transition-colors"
                      aria-label={`Edit ${deadline.title}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
