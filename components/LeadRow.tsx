'use client';
import type { Lead, LeadStatus } from '@/types/lead';
import StatusSelect from '@/components/StatusSelect';

interface LeadRowProps {
  lead: Lead;
  onStatusChange: (id: string, status: LeadStatus) => Promise<void>;
}

const TRUNCATE_LEN = 80;

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export default function LeadRow({ lead, onStatusChange }: LeadRowProps) {
  const shortMessage = truncate(lead.message, TRUNCATE_LEN);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{lead.email}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{lead.budget}</td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs" title={lead.message}>
        {shortMessage}
      </td>
      <td className="px-4 py-3">
        <StatusSelect
          leadId={lead.id}
          leadName={lead.name}
          currentStatus={lead.status}
          onStatusChange={onStatusChange}
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {lead.createdAt.toLocaleDateString()}
      </td>
    </tr>
  );
}
