import { headers } from "next/headers";
import { Inter } from "next/font/google";

import { navigationDevice } from "@/components/layout/navigation-device";
import { requireSession } from "@/lib/auth/guards";
import { CreatorShell } from "@/features/creators/components/creator-shell";

const inter = Inter({ variable: "--font-marketer", subsets: ["latin"] });

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  const device = navigationDevice((await headers()).get("user-agent"));
  return (
    <div className={inter.variable}>
      <CreatorShell device={device}>{children}</CreatorShell>
    </div>
  );
}
