import { Inter } from "next/font/google";

import { RegisterWizard } from "@/features/auth/components/register/register-wizard";

const inter = Inter({ subsets: ["latin"] });

export default function RegisterPage() {
  return (
    <main className={`register-flow min-h-dvh px-4 ${inter.className}`}>
      <RegisterWizard />
    </main>
  );
}
