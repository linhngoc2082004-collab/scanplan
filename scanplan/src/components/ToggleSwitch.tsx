interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <span className="text-base text-gray-800">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 rounded-full peer-focus:outline-none transition-colors ${
          checked ? 'bg-brand' : 'bg-gray-300'
        }`}>
          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
          } mt-[2px]`} />
        </div>
      </div>
    </label>
  );
}