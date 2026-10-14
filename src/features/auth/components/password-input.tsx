"use client";

import { type ComponentProps, useState } from "react";

import { RegisterAsset } from "@/features/auth/components/register/register-asset";
import { cn } from "@/lib/utils";

/** Password field with the design's show/hide eye (closed = hidden, open = shown). */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={cn("pr-8", className)} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-[10px] flex items-center"
      >
        <RegisterAsset name={visible ? "eye-open" : "eye-closed"} />
      </button>
    </div>
  );
}
