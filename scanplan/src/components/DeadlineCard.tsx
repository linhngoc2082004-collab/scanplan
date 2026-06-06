import { Deadline } from '../types';

interface DeadlineCardProps {
  deadline: Deadline;
  isEditing: boolean;
  onStartEdit: () => void;
  editTitle: string;
  editDate: string;
  onEditTitleChange: (value: string) => void;
  onEditDateChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export default function DeadlineCard({
  deadline,
  isEditing,
  onStartEdit,
  editTitle,
  editDate,
  onEditTitleChange,
  onEditDateChange,
  onSaveEdit,
  onCancelEdit,
}: DeadlineCardProps) {
  if (isEditing) {
    return (
      <div className="bg-gray-50 rounded-lg px-4 py-3 mb-3">
        <div className="flex items-center gap-3 mb-3">
          {/* Calendar icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              className="text-base font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 w-full mb-1 focus:outline-none focus:border-brand"
            />
            <input
              type="text"
              value={editDate}
              onChange={(e) => onEditDateChange(e.target.value)}
              className="text-sm text-gray-500 bg-white border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:border-brand"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancelEdit}
            className="bg-gray-200 text-gray-600 rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-300 transition-colors"
            aria-label="Cancel edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={onSaveEdit}
            className="bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-green-600 transition-colors"
            aria-label="Save edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 mb-3">
      <div className="flex items-center gap-3">
        {/* Calendar icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-base font-medium text-gray-900">{deadline.title}</p>
          <p className="text-sm text-gray-500">{deadline.date}</p>
        </div>
      </div>
      {/* Edit pencil icon */}
      <button
        onClick={onStartEdit}
        className="text-gray-400 hover:text-brand transition-colors"
        aria-label="Edit deadline"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
    </div>
  );
}