'use client';
import type { LeadStatus } from '@/types/lead';

interface StatusSelectProps {
  leadId: string;
  leadName: string; // for aria-label
  currentStatus: LeadStatus;
  onStatusChange: (id: string, status: LeadStatus) => Promise<void>;
}

const STATUS_OPTIONS: LeadStatus[] = ['New', 'Contacted', 'Closed'];

export default function StatusSelect({ leadId, leadName, currentStatus, onStatusChange }: StatusSelectProps) {
  return (
    <select
      value={currentStatus}
      onChange={(e) => onStatusChange(leadId, e.target.value as LeadStatus)}
      aria-label={`Status for ${leadName}`}
      className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
