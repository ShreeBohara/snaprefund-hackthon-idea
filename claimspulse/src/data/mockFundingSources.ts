import type { FundingSource } from "../features/payments/types";

export const mockFundingSources: FundingSource[] = [
  { id: "fs-001", bankName: "Chase", last4: "4521", status: "active" },
  { id: "fs-002", bankName: "Bank of America", last4: "8890", status: "active" },
  { id: "fs-003", bankName: "Wells Fargo", last4: "1274", status: "active" },
  { id: "fs-004", bankName: "Citi", last4: "6633", status: "inactive" }
];
