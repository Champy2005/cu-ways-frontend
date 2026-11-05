import { TransactionHistory } from "@/features/transactions/history-page";

export const metadata = { title: "Transactions | CU Ways" };

export default function TransactionsPage({ searchParams }: PageProps<"/marketer/transactions">) {
  return <TransactionHistory workspace="marketer" searchParams={searchParams} />;
}
