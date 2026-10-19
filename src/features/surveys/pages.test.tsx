import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SurveysPage from "@/app/(app)/surveys/page";
import SurveyDetailsPage from "@/app/(app)/surveys/[id]/page";
import { getSurvey, getSurveys } from "./api";
import { ApiError } from "@/lib/api/errors";
import { savedSurvey } from "./test-fixtures";

vi.mock("./api", () => ({ getSurvey: vi.fn(), getSurveys: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not found");
  },
}));
afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());
describe("saved survey pages", () => {
  it("renders the actual saved list with real detail links", async () => {
    vi.mocked(getSurveys).mockResolvedValue([savedSurvey]);
    render(await SurveysPage());
    expect(screen.getByRole("link", { name: savedSurvey.title })).toHaveAttribute(
      "href",
      "/surveys/7",
    );
    expect(screen.queryByText("No surveys yet")).not.toBeInTheDocument();
  });
  it("distinguishes an empty list from a backend failure", async () => {
    vi.mocked(getSurveys).mockResolvedValueOnce([]);
    const first = render(await SurveysPage());
    expect(screen.getByText("No surveys yet")).toBeVisible();
    first.unmount();
    vi.mocked(getSurveys).mockRejectedValue(new Error("offline"));
    render(await SurveysPage());
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("link", { name: "Create Survey" })).toHaveAttribute(
      "href",
      "/surveys/new",
    );
    expect(screen.queryByText("No surveys yet")).not.toBeInTheDocument();
  });
  it("renders persisted metadata and keeps unsafe legacy links inert", async () => {
    vi.mocked(getSurvey).mockResolvedValue({ ...savedSurvey, survey_link: "javascript:alert(1)" });
    render(
      await SurveyDetailsPage({
        params: Promise.resolve({ id: "7" }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(screen.getByRole("heading", { name: savedSurvey.title })).toBeVisible();
    expect(screen.getByText("2026-12-31")).toBeVisible();
    expect(screen.queryByRole("link", { name: /javascript/ })).not.toBeInTheDocument();
  });
  it("shows access errors without exposing the record", async () => {
    vi.mocked(getSurvey).mockRejectedValue(new ApiError(403, "forbidden", "Forbidden"));
    render(
      await SurveyDetailsPage({
        params: Promise.resolve({ id: "7" }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("may belong to another Creator");
    expect(screen.queryByText(savedSurvey.title)).not.toBeInTheDocument();
  });
  it.each(["0", "-1", "abc", "2147483648"])(
    "rejects invalid route ID %s before reading",
    async (id) => {
      await expect(
        SurveyDetailsPage({ params: Promise.resolve({ id }), searchParams: Promise.resolve({}) }),
      ).rejects.toThrow("not found");
      expect(getSurvey).not.toHaveBeenCalled();
    },
  );
});
