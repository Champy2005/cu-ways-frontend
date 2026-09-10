import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { MarketerRating } from "@/features/marketers/components/marketer-rating";

afterEach(cleanup);

describe("MarketerRating", () => {
  it("shows the rating supplied by the backend", () => {
    render(<MarketerRating value={4.8} />);
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.queryByText("No ratings yet")).not.toBeInTheDocument();
  });

  it("shows the stat variant with the /5.0 suffix", () => {
    render(<MarketerRating value={4.8} variant="stat" />);
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText("/ 5.0")).toBeInTheDocument();
  });

  it("shows 'No ratings yet' instead of a zero when unrated", () => {
    render(<MarketerRating value={null} />);
    expect(screen.getByText("No ratings yet")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("0.0")).not.toBeInTheDocument();
  });

  it("renders no stars at all when unrated", () => {
    const { container } = render(<MarketerRating value={null} variant="stat" />);
    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });
});
