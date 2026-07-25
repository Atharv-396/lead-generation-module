'use client';
import type { Lead, LeadStatus } from '@/types/lead';
import LeadRow from '@/components/LeadRow';
import SkeletonRow from '@/components/SkeletonRow';

interface AdminTableProps {
  leads: Lead[];
  isLoading: boolean;
  onStatusChange: (id: string, status: LeadStatus) => Promise<void>;
}

const COLUMNS = 6;
const SKELETON_COUNT = 10;

export default function AdminTable({ leads, isLoading, onStatusChange }: AdminTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Name', 'Email', 'Budget', 'Message', 'Status', 'Created'].map((h) => (
              <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {isLoading ? (
            Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonRow key={i} columns={COLUMNS} />
            ))
          ) : leads.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS} className="px-4 py-8 text-center text-gray-500">
                No leads submitted yet
              </td>
            </tr>
          ) : (
            leads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} onStatusChange={onStatusChange} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
