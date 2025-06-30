import React from 'react';
import { clsx } from 'clsx';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: DropdownOption[];
  label?: string;
  error?: string;
  variant?: 'default' | 'ghost';
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  label,
  error,
  variant = 'default',
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        className={clsx(
          "w-full px-3 py-2 rounded-md bg-white text-black border transition-all duration-200",
          variant === 'ghost' ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border-gray-300',
          error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          className
        )}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};