import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CreatorOverview } from "@/features/creators/components/creator-overview";

afterEach(cleanup);

describe("CreatorOverview", () => {
  it("shows the creator identity and links to marketer discovery", () => {
    render(<CreatorOverview name="Nila Example" />);

    expect(screen.getByRole("region", { name: "Creator identity" })).toHaveTextContent(
      "Nila Example",
    );
    expect(screen.getByRole("link", { name: "Discover marketers" })).toHaveAttribute(
      "href",
      "/creator/discovery",
    );
  });

  it("leaves out the marketer-only quickview and recent jobs", () => {
    render(<CreatorOverview name="Nila Example" />);

    expect(screen.queryByRole("heading", { name: "Quickview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recent jobs" })).not.toBeInTheDocument();
  });
});
