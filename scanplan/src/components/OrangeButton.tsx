import { ReactNode } from 'react';

interface OrangeButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export default function OrangeButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}: OrangeButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-lg font-semibold text-base transition-colors ${
        disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-brand text-white hover:opacity-90'
      } ${className}`}
    >
      {children}
    </button>
  );
}