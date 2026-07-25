'use client';

interface InputOption {
  value: string;
  label: string;
}

interface InputProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'textarea' | 'select';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  options?: InputOption[];
}

const baseClasses =
  'border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  maxLength,
  placeholder,
  options = [],
}: InputProps) {
  const errorId = `${id}-error`;

  const fieldClasses = [
    baseClasses,
    error ? 'border-red-500' : 'border-gray-300',
  ].join(' ');

  const ariaProps = error
    ? { 'aria-invalid': 'true' as const, 'aria-describedby': errorId }
    : {};

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          rows={4}
          className={fieldClasses}
          {...ariaProps}
        />
      ) : type === 'select' ? (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={fieldClasses}
          {...ariaProps}
        >
          <option value="" disabled>
            {placeholder ?? 'Select an option'}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          className={fieldClasses}
          {...ariaProps}
        />
      )}

      {error && (
        <span id={errorId} className="text-red-500 text-sm mt-1 block">
          {error}
        </span>
      )}
    </div>
  );
}
