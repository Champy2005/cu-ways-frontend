import { Inter } from "next/font/google";
import { requireSession } from "@/lib/auth/guards";
import { MarketerShell } from "@/features/marketers/components/marketer-shell";

const inter = Inter({ variable: "--font-marketer", subsets: ["latin"] });

export default async function MarketerLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return (
    <div className={inter.variable}>
      <MarketerShell>{children}</MarketerShell>
    </div>
  );
}
