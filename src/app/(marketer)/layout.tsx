import { headers } from "next/headers";
import { navigationDevice } from "@/components/layout/navigation-device";
import { Inter } from "next/font/google";
import { requireSession } from "@/lib/auth/guards";
import { MarketerShell } from "@/features/marketers/components/marketer-shell";

const inter = Inter({ variable: "--font-marketer", subsets: ["latin"] });

export default async function MarketerLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  const device = navigationDevice((await headers()).get("user-agent"));
  return (
    <div className={inter.variable}>
      <MarketerShell device={device}>{children}</MarketerShell>
    </div>
  );
}
