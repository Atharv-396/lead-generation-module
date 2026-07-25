'use client';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <input
      type="search"
      id="lead-search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search by name or email…"
      className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Search leads by name or email"
    />
  );
}
