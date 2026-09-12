import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { MarketerSearchPanel } from "@/features/marketer-discovery/components/marketer-search-panel";
import { EMPTY_MARKETER_QUERY } from "@/features/marketer-discovery/schemas";

const push = vi.fn();

// The panel only ever writes to the URL; the parsed query arrives as a prop, so
// stubbing the router is enough to assert the whole state-preservation encoding.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("MarketerSearchPanel", () => {
  it("pushes the keyword into the URL on submit", () => {
    render(<MarketerSearchPanel query={EMPTY_MARKETER_QUERY} />);

    fireEvent.change(screen.getByLabelText("Search marketers"), { target: { value: "food" } });
    fireEvent.submit(screen.getByRole("search"));

    expect(push).toHaveBeenCalledWith("/marketers?q=food", { scroll: false });
  });

  it("seeds the input from the query already in the URL", () => {
    render(<MarketerSearchPanel query={{ ...EMPTY_MARKETER_QUERY, q: "food" }} />);
    expect(screen.getByLabelText("Search marketers")).toHaveValue("food");
  });

  it("renders a removable chip per active filter", () => {
    render(
      <MarketerSearchPanel
        query={{ ...EMPTY_MARKETER_QUERY, expertise: ["data-collection"], sort: "rating_desc" }}
      />,
    );

    expect(screen.getByText("Data Collection")).toBeInTheDocument();
    expect(screen.getByText("Rating: high to low")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Data Collection filter" }),
    ).toBeInTheDocument();
  });

  it("drops only the removed filter from the pushed URL", () => {
    render(
      <MarketerSearchPanel
        query={{
          ...EMPTY_MARKETER_QUERY,
          q: "food",
          expertise: ["data-collection"],
          sort: "rating_desc",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove Data Collection filter" }));

    expect(push).toHaveBeenCalledWith("/marketers?q=food&sort=rating_desc", { scroll: false });
  });
});
