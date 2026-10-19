import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { InvitationTab } from "../types";

export function EmptyInvitations({
  tab,
  searching,
  onClear,
  searchDescription = "Try another job title or creator name.",
}: {
  tab: InvitationTab;
  searching: boolean;
  onClear: () => void;
  searchDescription?: string;
}) {
  const title = searching
    ? "No matching invitations"
    : tab === "pending"
      ? "All caught up! No pending requests"
      : "No responded invitations yet";
  const description = searching
    ? searchDescription
    : tab === "pending"
      ? "You don’t have any direct invitations at the moment. Keep your profile updated for future opportunities."
      : "Invitations you accept or decline will appear here.";
  return (
    <div className="ji-empty">
      <Image src="/marketer-assets/mascot.svg" width={150} height={150} alt="" />
      <h2>{title}</h2>
      <p className="ji-muted">{description}</p>
      {searching && (
        <Button variant="outline" className="ji-secondary" onClick={onClear}>
          Clear search
        </Button>
      )}
    </div>
  );
}
