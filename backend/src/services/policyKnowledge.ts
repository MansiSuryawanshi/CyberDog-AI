export interface PolicySection {
  title: string;
  points: string[];
}

export const policyKnowledge: Record<string, PolicySection> = {
  leave: {
    title: "Leave Policy",
    points: [
      "Annual Leave: All full-time employees are entitled to 25 days of paid annual leave per year.",
      "Sick Leave: We offer unlimited sick leave, provided a medical note is submitted for absences exceeding 3 consecutive days.",
      "Parental Leave: 16 weeks of fully paid leave for both primary and secondary caregivers.",
      "Bereavement: Up to 5 days of paid leave for the loss of an immediate family member."
    ]
  },
  workplace: {
    title: "Workplace & Remote Work Rules",
    points: [
      "Hybrid Model: Employees are required to be in the office 2 days per week (Tuesday and Thursday are recommended).",
      "Core Hours: Our core collaborative hours are 10:00 AM to 4:00 PM local time.",
      "Workspace Stipend: $500 yearly budget for home office ergonomics and equipment.",
      "Quiet Hours: No internal meetings on Wednesdays to focus on deep work."
    ]
  },
  expenses: {
    title: "Expenses & Reimbursement",
    points: [
      "Travel: Business class is allowed for flights exceeding 6 hours. Economy for shorter flights.",
      "Meals: Daily meal stipend of $25 per day during business travel.",
      "Internet: Monthly $50 reimbursement for home internet for remote workers.",
      "Approval: All expenses over $100 require pre-approval from your direct manager."
    ]
  },
  security: {
    title: "Security & Compliance",
    points: [
      "MFA: Multi-factor authentication is mandatory for all internal systems.",
      "Device Encryption: All company laptops must have full-disk encryption enabled.",
      "Passwords: Use a password manager; passwords must be at least 16 characters and rotated every 90 days.",
      "Data Handling: Never store customer PII on local drives; use the secure internal vault."
    ]
  },
  conduct: {
    title: "Code of Conduct",
    points: [
      "Ethical AI: All AI models must undergo a bias and safety audit before deployment.",
      "Anti-Harassment: We maintain a zero-tolerance policy for harassment or discrimination of any kind.",
      "Confidentiality: Trade secrets and internal discussions are strictly confidential.",
      "Conflict of Interest: Outside employment or consulting requires HR approval to ensure no conflict."
    ]
  }
};
