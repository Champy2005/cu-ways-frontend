import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { isMissingMarketerProfile, marketerFailure } from "./failures";

describe("marketer page failures", () => {
  it("treats only a missing own profile as a first-time marketer", () => {
    expect(
      isMissingMarketerProfile(new ApiError(404, "marketer_profile_not_found", "Not found")),
    ).toBe(true);
    expect(isMissingMarketerProfile(new ApiError(404, "marketer_not_found", "Not found"))).toBe(
      false,
    );
    expect(
      isMissingMarketerProfile(new ApiError(403, "marketer_profile_not_found", "Forbidden")),
    ).toBe(false);
    expect(isMissingMarketerProfile(new Error("network"))).toBe(false);
  });

  it.each([
    [401, "unauthorized", "unauthorized"],
    [403, "not_a_marketer", "ineligible"],
    [403, "forbidden", "forbidden"],
    [404, "marketer_not_found", "missing"],
    [404, "request_failed", "unavailable"],
    [503, "backend_unavailable", "unavailable"],
  ])("maps %s %s without inventing empty data", (status, code, expected) => {
    expect(marketerFailure(new ApiError(status as number, code as string, "Request failed"))).toBe(
      expected,
    );
  });
});
