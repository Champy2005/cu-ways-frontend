import { beforeEach, describe, expect, it, vi } from "vitest";
import MarketerProfilePage from "@/app/(marketer)/marketer/profile/page";
import { requireSession } from "@/lib/auth/guards";
import { getMyProfile } from "./api";
import { getUser } from "@/features/users/api";
import { ApiError } from "@/lib/api/errors";
import { initialDemoState } from "./demo/store";

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("./api", () => ({ getMyProfile: vi.fn() }));
vi.mock("@/features/users/api", () => ({ getUser: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireSession).mockResolvedValue({ userId: 101 } as Awaited<
    ReturnType<typeof requireSession>
  >);
  vi.mocked(getMyProfile).mockResolvedValue(initialDemoState.profile);
  vi.mocked(getUser).mockResolvedValue(
    initialDemoState.contact as Awaited<ReturnType<typeof getUser>>,
  );
});
const query = { searchParams: Promise.resolve({ tab: "basic" }) };

describe("Unified profile server boundary", () => {
  it("requires a session before starting either private request", async () => {
    vi.mocked(requireSession).mockRejectedValue(new Error("Session required"));
    await expect(MarketerProfilePage(query)).rejects.toThrow("Session required");
    expect(getMyProfile).not.toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
  });
  it("starts both requests before either resolves and isolates transport failures", async () => {
    let reject!: (reason: Error) => void;
    vi.mocked(getMyProfile).mockReturnValue(
      new Promise((_, fail) => {
        reject = fail;
      }),
    );
    const result = MarketerProfilePage(query);
    await vi.waitFor(() => expect(getUser).toHaveBeenCalledWith(101));
    reject(new Error("Backend unavailable"));
    const page = await result;
    expect(page.props.contact).toEqual(initialDemoState.contact);
    expect(page.props.professionalFailure).toBe("unavailable");
    expect(page.props.profile).toBeUndefined();
    expect(page.props.initialTab).toBe("basic");
  });
  it("keeps professional information available if contacts fail", async () => {
    vi.mocked(getUser).mockRejectedValue(new Error("Contact endpoint unavailable"));
    const page = await MarketerProfilePage(query);
    expect(page.props.profile).toEqual(initialDemoState.profile);
    expect(page.props.contactFailure).toBe("unavailable");
  });
  it("preserves explicit non-marketer eligibility failures", async () => {
    vi.mocked(getMyProfile).mockRejectedValue(
      new ApiError(403, "not_a_marketer", "Marketer required"),
    );
    expect((await MarketerProfilePage(query)).props.kind).toBe("ineligible");
  });
});

it("opens onboarding only for a confirmed missing marketer profile", async () => {
  vi.mocked(getMyProfile).mockRejectedValue(
    new ApiError(404, "marketer_profile_not_found", "No profile"),
  );
  const page = await MarketerProfilePage(query);
  expect(page.props.onboarding).toBe(true);
  expect(page.props.profile).toMatchObject({
    user_id: 101,
    bio: "",
    expertise: [],
    campuses: [],
    availability_status: "available",
  });
  expect(page.props.professionalFailure).toBeUndefined();
});
it("does not confuse an unknown 404 with onboarding", async () => {
  vi.mocked(getMyProfile).mockRejectedValue(new ApiError(404, "not_found", "Not found"));
  const page = await MarketerProfilePage(query);
  expect(page.props.onboarding).toBe(false);
  expect(page.props.profile).toBeUndefined();
  expect(page.props.professionalFailure).toBe("unavailable");
});
