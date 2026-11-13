import { TransactionHistory } from "@/features/transactions/history-page";

export const metadata = { title: "Transactions | CU Ways" };

export default function TransactionsPage({ searchParams }: PageProps<"/creator/transactions">) {
  return <TransactionHistory workspace="creator" searchParams={searchParams} />;
}
