import type { Payment } from "../features/payments/types";

const HOUR_MS = 1000 * 60 * 60;

function isoHoursAgo(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * HOUR_MS).toISOString();
}

export const mockPayments: Payment[] = [
  {
    id: "PAY-1042",
    claimId: "CLM-4521",
    recipientEmail: "nina.hart@example.com",
    amountUsd: 52000,
    status: "awaiting-cash-out",
    fundingSourceId: "fs-001",
    createdAt: isoHoursAgo(80),
    updatedAt: isoHoursAgo(80)
  },
  {
    id: "PAY-1043",
    claimId: "CLM-9087",
    recipientEmail: "leo.gray@example.com",
    amountUsd: 2100,
    status: "failed",
    fundingSourceId: "fs-002",
    createdAt: isoHoursAgo(8),
    updatedAt: isoHoursAgo(4),
    achReturnCode: "R03"
  },
  {
    id: "PAY-1044",
    claimId: "CLM-6634",
    recipientEmail: "maya.wells@example.com",
    amountUsd: 800,
    status: "awaiting-cash-out",
    fundingSourceId: "fs-001",
    createdAt: isoHoursAgo(49),
    updatedAt: isoHoursAgo(49),
    openedAt: isoHoursAgo(48)
  },
  {
    id: "PAY-1045",
    claimId: "CLM-1022",
    recipientEmail: "omar.stone@example.com",
    amountUsd: 16000,
    status: "awaiting-cash-out",
    fundingSourceId: "fs-003",
    createdAt: isoHoursAgo(26),
    updatedAt: isoHoursAgo(26)
  },
  {
    id: "PAY-1046",
    claimId: "CLM-7751",
    recipientEmail: "ava.moon@example.com",
    amountUsd: 1200,
    status: "in-transit",
    fundingSourceId: "fs-001",
    createdAt: isoHoursAgo(6),
    updatedAt: isoHoursAgo(2)
  },
  {
    id: "PAY-1047",
    claimId: "CLM-3366",
    recipientEmail: "erin.lane@example.com",
    amountUsd: 4200,
    status: "lock",
    fundingSourceId: "fs-002",
    createdAt: isoHoursAgo(18),
    updatedAt: isoHoursAgo(10)
  },
  {
    id: "PAY-1048",
    claimId: "CLM-2208",
    recipientEmail: "cory.park@example.com",
    amountUsd: 6800,
    status: "completed",
    fundingSourceId: "fs-001",
    createdAt: isoHoursAgo(42),
    updatedAt: isoHoursAgo(20)
  },
  {
    id: "PAY-1049",
    claimId: "CLM-9188",
    recipientEmail: "lena.brooks@example.com",
    amountUsd: 950,
    status: "completed",
    fundingSourceId: "fs-003",
    createdAt: isoHoursAgo(30),
    updatedAt: isoHoursAgo(14)
  },
  {
    id: "PAY-1050",
    claimId: "CLM-8812",
    recipientEmail: "ravi.singh@example.com",
    amountUsd: 3400,
    status: "failed",
    fundingSourceId: "fs-002",
    createdAt: isoHoursAgo(20),
    updatedAt: isoHoursAgo(16),
    achReturnCode: "R01"
  },
  {
    id: "PAY-1051",
    claimId: "CLM-7743",
    recipientEmail: "jane.turner@example.com",
    amountUsd: 14000,
    status: "awaiting-cash-out",
    fundingSourceId: "fs-003",
    createdAt: isoHoursAgo(9),
    updatedAt: isoHoursAgo(9)
  },
  {
    id: "PAY-1052",
    claimId: "CLM-1215",
    recipientEmail: "victor.reed@example.com",
    amountUsd: 2600,
    status: "cancelled",
    fundingSourceId: "fs-003",
    createdAt: isoHoursAgo(120),
    updatedAt: isoHoursAgo(115)
  },
  {
    id: "PAY-1053",
    claimId: "CLM-3871",
    recipientEmail: "nora.kent@example.com",
    amountUsd: 4300,
    status: "completed",
    fundingSourceId: "fs-002",
    createdAt: isoHoursAgo(55),
    updatedAt: isoHoursAgo(5)
  }
];
