import { ChecklistQuestion } from '../types';

export interface ChecklistSection {
  key: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  title: string;
  subtitle: string;
}

export const CHECKLIST_SECTIONS: ChecklistSection[] = [
  { key: 'A', title: 'Genuine Customer', subtitle: 'Verify customer interest and basic awareness' },
  { key: 'B', title: 'House and Roof', subtitle: 'Ownership and rooftop structural suitability' },
  { key: 'C', title: 'Electricity Connection', subtitle: 'Meter category, sanctioned load & billing history' },
  { key: 'D', title: 'Documents', subtitle: 'Aadhaar, PAN and bank account verification' },
  { key: 'E', title: 'Size, Brand and Price', subtitle: 'System capacity, specifications and cost approval' },
  { key: 'F', title: 'Money and Decision', subtitle: 'Payment mode readiness and decision-maker availability' },
  { key: 'G', title: 'Proof and Visit', subtitle: 'WhatsApp photos received and survey visit slot booked' },
];

export const DEFAULT_CHECKLIST_QUESTIONS: ChecklistQuestion[] = [
  // A. Genuine customer
  {
    id: 'q1',
    sectionKey: 'A',
    sectionTitle: 'Genuine Customer',
    questionText: 'Filled the Meta form personally and wants solar for own house?',
    order: 1,
  },
  {
    id: 'q2',
    sectionKey: 'A',
    sectionTitle: 'Genuine Customer',
    questionText: 'Knows solar is not free and the subsidy (up to ₹78,000) comes to the bank account after installation?',
    order: 2,
  },
  {
    id: 'q3',
    sectionKey: 'A',
    sectionTitle: 'Genuine Customer',
    questionText: 'Knows on-grid gives no power during a power cut?',
    order: 3,
  },
  {
    id: 'q4',
    sectionKey: 'A',
    sectionTitle: 'Genuine Customer',
    questionText: 'Chose the Hybrid system (battery backup)? (No = On-grid)',
    order: 4,
  },

  // B. House and roof
  {
    id: 'q5',
    sectionKey: 'B',
    sectionTitle: 'House and Roof',
    questionText: 'House is own (property papers in applicant’s name, or owner gives NOC)?',
    order: 5,
  },
  {
    id: 'q6',
    sectionKey: 'B',
    sectionTitle: 'House and Roof',
    questionText: 'Roof is concrete (RCC/pucca)?',
    order: 6,
  },
  {
    id: 'q7',
    sectionKey: 'B',
    sectionTitle: 'House and Roof',
    questionText: 'Has shadow-free roof space (100 sq ft per kW)?',
    order: 7,
  },
  {
    id: 'q8',
    sectionKey: 'B',
    sectionTitle: 'House and Roof',
    questionText: 'No new floor planned in next 5 years, and all owners agree?',
    order: 8,
  },

  // C. Electricity connection
  {
    id: 'q9',
    sectionKey: 'C',
    sectionTitle: 'Electricity Connection',
    questionText: 'Electricity bill is in the applicant’s name?',
    order: 9,
  },
  {
    id: 'q10',
    sectionKey: 'C',
    sectionTitle: 'Electricity Connection',
    questionText: 'Connection type is Domestic (home)?',
    order: 10,
  },
  {
    id: 'q11',
    sectionKey: 'C',
    sectionTitle: 'Electricity Connection',
    questionText: 'No pending dues on the electricity bill?',
    order: 11,
  },
  {
    id: 'q12',
    sectionKey: 'C',
    sectionTitle: 'Electricity Connection',
    questionText: 'Sanctioned load noted, and agrees to load increase if needed?',
    order: 12,
  },
  {
    id: 'q13',
    sectionKey: 'C',
    sectionTitle: 'Electricity Connection',
    questionText: 'Never taken a solar subsidy before, and not applied with another vendor?',
    order: 13,
  },

  // D. Documents
  {
    id: 'q14',
    sectionKey: 'D',
    sectionTitle: 'Documents',
    questionText: 'Has valid Aadhaar, PAN, active bank account, mobile number and Gmail ID?',
    order: 14,
  },
  {
    id: 'q15',
    sectionKey: 'D',
    sectionTitle: 'Documents',
    questionText: 'Name spelling is the same on Aadhaar, PAN, bank passbook and electricity bill?',
    order: 15,
  },
  {
    id: 'q16',
    sectionKey: 'D',
    sectionTitle: 'Documents',
    questionText: 'Bank account is linked with Aadhaar and PAN?',
    order: 16,
  },

  // E. Size, brand and price
  {
    id: 'q17',
    sectionKey: 'E',
    sectionTitle: 'Size, Brand and Price',
    questionText: 'Agrees to the system size and brand?',
    order: 17,
  },
  {
    id: 'q18',
    sectionKey: 'E',
    sectionTitle: 'Size, Brand and Price',
    questionText: 'Agrees to the full (gross) price?',
    order: 18,
  },

  // F. Money and decision
  {
    id: 'q19',
    sectionKey: 'F',
    sectionTitle: 'Money and Decision',
    questionText: 'Money is ready (cash, or loan with 10% down payment, no old loan default, Aadhaar linked to mobile)?',
    order: 19,
  },
  {
    id: 'q20',
    sectionKey: 'F',
    sectionTitle: 'Money and Decision',
    questionText: 'Agrees to pay the booking amount after PM Surya Ghar paperwork is complete?',
    order: 20,
  },
  {
    id: 'q21',
    sectionKey: 'F',
    sectionTitle: 'Money and Decision',
    questionText: 'Decision-maker will be at home during the visit and the family agrees?',
    order: 21,
  },
  {
    id: 'q22',
    sectionKey: 'F',
    sectionTitle: 'Money and Decision',
    questionText: 'Wants installation within 30 days?',
    order: 22,
  },

  // G. Proof and visit
  {
    id: 'q23',
    sectionKey: 'G',
    sectionTitle: 'Proof and Visit',
    questionText: 'Received on WhatsApp: electricity bill photo, roof photo and Google Maps location, and visit date, time, full address and landmark are fixed?',
    order: 23,
  },
];
