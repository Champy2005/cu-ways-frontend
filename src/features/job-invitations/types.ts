// Frontend view models; the backend API contract has not been published yet.
export type RequestStatus = "Pending" | "Accepted" | "Declined" | "Closed";
export type OfferStatus = "Pending" | "Accepted" | "Rejected" | "Withdrawn";
export type InvitationTab = "pending" | "responded";

export type JobSummary = {
  id: string;
  title: string;
  budget: string;
  deadline: string;
  target: number;
  surveys: { title: string; url: string | null }[];
  brief: { title: string; text: string };
};

export type Invitation = {
  id: string;
  creator: string;
  job: JobSummary;
  message: string;
  invitedAt: string;
  status: RequestStatus;
  respondedAt: string | null;
  declineReason: string | null;
  declineNote: string;
};

export type OfferInput = { price: string; deliveryDate: string; message: string };
export type Offer = OfferInput & {
  id: string;
  requestId: string;
  status: OfferStatus;
  createdAt: string;
  withdrawnAt: string | null;
};
export type DeclineInput = { reason: string | null; note: string };
export type InvitationActions = {
  accept: (requestId: string) => Promise<void>;
  decline: (requestId: string, input: DeclineInput) => Promise<void>;
  submit: (requestId: string, input: OfferInput) => Promise<void>;
  withdraw: (requestId: string) => Promise<void>;
};
export type OfferErrors = Partial<Record<keyof OfferInput, string>>;
