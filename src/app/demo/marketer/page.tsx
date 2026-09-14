import { headers } from "next/headers";
import { navigationDevice } from "@/components/layout/navigation-device";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { MarketerShell } from "@/features/marketers/components/marketer-shell";
import { DemoWorkspace } from "@/features/marketers/demo/demo-workspace";
import { isMarketerDemoEnabled } from "@/features/marketers/demo/enabled";

const inter = Inter({ variable: "--font-marketer", subsets: ["latin"] });
export const metadata = {
  title: "Marketer demo | CU Ways",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MarketerDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  if (!isMarketerDemoEnabled()) notFound();
  const { view } = await searchParams;
  const device = navigationDevice((await headers()).get("user-agent"));
  return (
    <div className={inter.variable}>
      <MarketerShell device={device} demo demoView={view}>
        <DemoWorkspace view={view ?? "dashboard"} />
      </MarketerShell>
    </div>
  );
}
