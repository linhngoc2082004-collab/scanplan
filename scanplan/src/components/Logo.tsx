import { useNavigate } from 'react-router-dom';

export default function Logo() {
  const navigate = useNavigate();

  return (
    <div className="text-center mb-8 cursor-pointer" onClick={() => navigate('/')}>
      <h1 className="text-3xl font-bold text-brand">ScanPlan</h1>
      <p className="text-gray-500 text-sm mt-1">Never miss a deadline again!</p>
    </div>
  );
}