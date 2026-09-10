import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { EmptyState } from "@/components/feedback/empty-state";

// vitest.config.mts does not set `globals`, so Testing Library never registers
// its own afterEach(cleanup) and each test must do it explicitly.
afterEach(cleanup);

describe("EmptyState", () => {
  it("renders the title and description", () => {
    render(<EmptyState title="No marketers yet" description="Nothing to show." />);

    expect(screen.getByRole("heading", { name: "No marketers yet" })).toBeInTheDocument();
    expect(screen.getByText("Nothing to show.")).toBeInTheDocument();
  });

  it("renders the optional icon and action when provided", () => {
    render(
      <EmptyState
        title="No results"
        description="Try again."
        icon={<span data-testid="icon" />}
        action={<button type="button">Clear</button>}
      />,
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });

  it("omits the icon and action containers when they are not provided", () => {
    render(<EmptyState title="No results" description="Try again." />);

    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
