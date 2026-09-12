"use client";

import { MarketerRoleBirds } from "./marketer-role-birds";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export function MarketerRolePicker() {
  const [role, setRole] = useState("Marketer");
  const portal = useRef<HTMLDivElement>(null);
  return (
    <div className="mk-role-picker" ref={portal}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          aria-label={`Switch role preview, current: ${role}`}
          render={<Button variant="ghost" className="mk-role-trigger" />}
        >
          <MarketerRoleBirds role={role} />
          <span className="mk-role-caption">
            <span>{role}</span>
            <small>Preview only</small>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          container={portal}
          align="end"
          sideOffset={10}
          className="mk-role-menu"
        >
          <p className="px-2 py-2 text-xs text-[var(--mk-muted)]">
            Preview only — your account stays unchanged.
          </p>
          <DropdownMenuRadioGroup
            value={role}
            onValueChange={(value) => {
              setRole(value);
            }}
          >
            <DropdownMenuRadioItem value="Marketer" closeOnClick className="min-h-11">
              Marketer
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="Creator" closeOnClick className="min-h-11">
              Creator
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="sr-only" role="status">
        {role} preview selected. Your account is unchanged.
      </span>
    </div>
  );
}
