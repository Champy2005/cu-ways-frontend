import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { createSurvey } from "../browser-api";
import { savedSurvey } from "../test-fixtures";
import { CreateSurveyForm } from "./create-survey-form";

const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("../browser-api", () => ({ createSurvey: vi.fn() }));
afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());
function fillForm() {
  render(<CreateSurveyForm />);
  fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "Campus research" } });
  fireEvent.change(screen.getByLabelText(/Survey URL/), {
    target: { value: savedSurvey.survey_link },
  });
}
function submit() {
  fireEvent.submit(screen.getByRole("button", { name: /Creat(ing|e) Survey/ }).closest("form")!);
}
describe("CreateSurveyForm", () => {
  it("validates before submission", () => {
    render(<CreateSurveyForm />);
    submit();
    expect(screen.getByRole("alert")).toHaveTextContent("Title is required");
    expect(createSurvey).not.toHaveBeenCalled();
  });
  it("prevents duplicate submissions and opens the real saved survey", async () => {
    let resolve!: (value: typeof savedSurvey) => void;
    vi.mocked(createSurvey).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    fillForm();
    submit();
    submit();
    expect(createSurvey).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Creating Survey..." })).toBeDisabled();
    expect(screen.getByLabelText(/Title/)).toBeDisabled();
    resolve(savedSurvey);
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/surveys/7?created=1"));
  });
  it("preserves input after a validation rejection and allows correction", async () => {
    vi.mocked(createSurvey).mockRejectedValue(
      new ApiError(422, "validation_error", "Invalid metadata"),
    );
    fillForm();
    submit();
    await screen.findByRole("alert");
    expect(screen.getByLabelText(/Title/)).toHaveValue("Campus research");
    expect(screen.getByRole("button", { name: "Create Survey" })).toBeEnabled();
    expect(navigation.push).not.toHaveBeenCalled();
  });
  it("blocks retries after an uncertain result and offers a saved-record check", async () => {
    vi.mocked(createSurvey).mockRejectedValue(new TypeError("Connection lost"));
    fillForm();
    submit();
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Create Survey" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Check My surveys" })).toHaveAttribute(
      "href",
      "/surveys",
    );
    submit();
    expect(createSurvey).toHaveBeenCalledTimes(1);
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
