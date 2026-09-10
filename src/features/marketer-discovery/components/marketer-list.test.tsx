import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { MarketerList } from "@/features/marketer-discovery/components/marketer-list";
import { EMPTY_MARKETER_QUERY } from "@/features/marketer-discovery/schemas";
import type { MarketerSummary } from "@/features/marketer-discovery/types";

afterEach(cleanup);

const marketers: MarketerSummary[] = [
  {
    marketer_id: 1,
    display_name: "Ms. Youtube Spotify",
    headline: "Biochemist",
    is_verified: true,
    average_rating: 4.8,
    rating_count: 22,
  },
  {
    marketer_id: 4,
    display_name: "Mr. Anan S.",
    headline: "DevOps Engineer",
    is_verified: true,
    average_rating: null,
    rating_count: 0,
  },
];

describe("MarketerList", () => {
  it("renders one link per marketer, carrying the query as a ref", () => {
    render(<MarketerList marketers={marketers} query={{ ...EMPTY_MARKETER_QUERY, q: "e" }} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/marketers/1?ref=q%3De");
    expect(screen.getByText("Ms. Youtube Spotify")).toBeInTheDocument();
  });

  it("shows 'No ratings yet' for an unrated marketer in the list", () => {
    render(<MarketerList marketers={marketers} query={EMPTY_MARKETER_QUERY} />);
    expect(screen.getByText("No ratings yet")).toBeInTheDocument();
  });

  it("names the keyword and offers a reset when a search matches nothing", () => {
    render(<MarketerList marketers={[]} query={{ ...EMPTY_MARKETER_QUERY, q: "zzz" }} />);

    expect(screen.getByRole("heading", { name: /No marketers match “zzz”/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear search and filters" })).toHaveAttribute(
      "href",
      "/marketers",
    );
  });

  it("mentions the filters when a filtered search matches nothing", () => {
    render(
      <MarketerList marketers={[]} query={{ ...EMPTY_MARKETER_QUERY, expertise: ["devops"] }} />,
    );

    expect(
      screen.getByRole("heading", { name: "No marketers match these filters" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear search and filters" })).toBeInTheDocument();
  });

  it("shows the neutral empty copy with no reset when nothing is searched", () => {
    render(<MarketerList marketers={[]} query={EMPTY_MARKETER_QUERY} />);

    expect(screen.getByRole("heading", { name: "No marketers yet" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
