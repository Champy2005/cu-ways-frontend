import { act, cleanup, render, screen } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setLocalQueries, useLocalQuery } from "./local-navigation";

function Query({ fallback }: { fallback?: string }) {
  const value = useLocalQuery("tab", "responded", fallback);
  return <output aria-label="Selected tab">{value}</output>;
}

beforeEach(() => window.history.replaceState(null, "", "/demo/marketer?tab=responded"));
afterEach(cleanup);

describe("local query defaults", () => {
  it("uses the client fallback when navigation removes the initial query", () => {
    render(<Query fallback="pending" />);
    expect(screen.getByLabelText("Selected tab")).toHaveTextContent("responded");
    act(() => setLocalQueries({ tab: null }));
    expect(screen.getByLabelText("Selected tab")).toHaveTextContent("pending");
    act(() => {
      window.history.replaceState(null, "", "/demo/marketer?tab=responded");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.getByLabelText("Selected tab")).toHaveTextContent("responded");
  });

  it("preserves the existing fallback for callers without a client default", () => {
    window.history.replaceState(null, "", "/demo/marketer");
    render(<Query />);
    expect(screen.getByLabelText("Selected tab")).toHaveTextContent("responded");
  });

  it("hydrates with the initial value before reading the current client URL", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(<Query fallback="pending" />);
    expect(container.textContent).toBe("responded");
    window.history.replaceState(null, "", "/demo/marketer");
    const recoverableError = vi.fn();
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <Query fallback="pending" />, {
          onRecoverableError: recoverableError,
        });
      });
      expect(container.textContent).toBe("pending");
      expect(recoverableError).not.toHaveBeenCalled();
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});
