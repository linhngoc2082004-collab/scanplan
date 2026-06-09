import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './screens/Login';
import CreateAccount from './screens/CreateAccount';
import UploadSyllabus from './screens/UploadSyllabus';
import ExtractingDeadlines from './screens/ExtractingDeadlines';
import DeadlinesDetected from './screens/DeadlinesDetected';
import ManualDeadline from './screens/ManualDeadline';
import ReminderSettings from './screens/ReminderSettings';
import Dashboard from './screens/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

const protectedPage = (page: React.ReactNode) => (
  <ProtectedRoute>{page}</ProtectedRoute>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<CreateAccount />} />
        <Route path="/upload" element={protectedPage(<UploadSyllabus />)} />
        <Route path="/extracting" element={protectedPage(<ExtractingDeadlines />)} />
        <Route path="/deadlines" element={protectedPage(<DeadlinesDetected />)} />
        <Route path="/manual-deadline" element={protectedPage(<ManualDeadline />)} />
        <Route path="/settings" element={protectedPage(<ReminderSettings />)} />
        <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
      </Routes>
    </BrowserRouter>
  );
}
