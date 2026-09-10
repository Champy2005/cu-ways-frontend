import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { marketerFailure } from "./failures";

describe("marketer page failures", () => {
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
