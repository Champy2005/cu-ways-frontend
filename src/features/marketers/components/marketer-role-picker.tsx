"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MarketerRoleBirds } from "./marketer-role-birds";

type Role = "Marketer" | "Creator";

const workspaceHref: Record<Role, string> = {
  Marketer: "/marketer/dashboard",
  Creator: "/creator/dashboard",
};

/**
 * One click switches to the other role's workspace. With `preview`, the switch stays local
 * (the demo has no session to navigate with) and never changes the account.
 */
export function MarketerRolePicker({
  initialRole = "Marketer",
  preview = false,
}: {
  initialRole?: Role;
  preview?: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(initialRole);
  const next: Role = role === "Marketer" ? "Creator" : "Marketer";
  return (
    <div className="mk-role-picker">
      <Button
        variant="ghost"
        className="mk-role-trigger"
        aria-label={`Switch to ${next}, current: ${role}`}
        onClick={() => {
          // Moving the birds first lets the switch animate while the next workspace loads.
          setRole(next);
          if (!preview) router.push(workspaceHref[next]);
        }}
      >
        <MarketerRoleBirds role={role} />
        <span className="mk-role-caption">
          <span>{role}</span>
          <small>{preview ? "Preview only" : `Switch to ${next}`}</small>
        </span>
      </Button>
      <span className="sr-only" role="status">
        {preview ? `${role} preview selected. Your account is unchanged.` : `${role} workspace`}
      </span>
    </div>
  );
}
