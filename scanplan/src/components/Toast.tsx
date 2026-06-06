interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  if (!visible) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg text-base font-medium">
        {message}
      </div>
    </div>
  );
}