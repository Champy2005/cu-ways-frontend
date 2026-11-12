import { PaymentPage } from "@/features/transactions/workflow-page";

export const metadata = { title: "Payment details | CU Ways" };

export default async function JobPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PaymentPage id={id} workspace="marketer" />;
}
