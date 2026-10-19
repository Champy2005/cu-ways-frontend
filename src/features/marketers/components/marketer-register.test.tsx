import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MarketerRegister } from "./marketer-register";

afterEach(cleanup);

describe("MarketerRegister", () => {
  it("invites a first-time marketer to the create account page", () => {
    render(<MarketerRegister />);

    expect(
      screen.getByRole("heading", { name: "Create the marketer account" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create" })).toHaveAttribute(
      "href",
      "/marketer/create-account",
    );
  });
});
