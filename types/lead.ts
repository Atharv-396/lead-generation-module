export type LeadStatus = 'New' | 'Contacted' | 'Closed';

export const BUDGET_OPTIONS = [
  'Under ₹10,000',
  '₹10,000 – ₹25,000',
  '₹25,000 – ₹50,000',
  '₹50,000+',
] as const;

export type BudgetOption = typeof BUDGET_OPTIONS[number];

export interface Lead {
  id: string;
  name: string;
  email: string;
  budget: BudgetOption;
  message: string;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLeadInput {
  name: string;
  email: string;
  budget: BudgetOption;
  message: string;
}

export interface UpdateLeadInput {
  status: LeadStatus;
}

export type LeadFormFields = CreateLeadInput;
