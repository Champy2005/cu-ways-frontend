import type { components } from "@/lib/api/generated/backend";

type Schemas = components["schemas"];
export type Workspace = "creator" | "marketer";
export type Transaction = Schemas["Transaction"];
export type TransactionPage = Schemas["TransactionListResponse"];
export type Settlement = Schemas["JobSettlement"];
export type Proof = Schemas["ProofListResponse"]["data"][number];
export type CurrentReview = Schemas["CurrentReviewResponse"]["data"];
export type PaymentInput = Schemas["CreatePaymentRequest"];

export type JobMutation =
  | { kind: "start" | "complete" }
  | { kind: "payment"; input: PaymentInput }
  | { kind: "proof"; url: string }
  | { kind: "review"; rating: number; comment: string };

export type MutationResult =
  { status: "saved" } | { status: "error" | "reconcile"; message: string };
