// GENERATED from ../model/scenarios.json by ../../stories/build.mjs.
export default {
  "schemaVersion": 1,
  "canonical": true,
  "story": "US-027",
  "title": "Job completion",
  "role": "Completion operator",
  "intro": "Check delivery proof, the accepted offer and payment before completing this job.",
  "source": {
    "workbook": "Backlog (3).xlsx",
    "acceptance": "Project Backlog row 28; US-031 row 32; Sprint Backlog III row 39",
    "inspectedOn": "2026-10-29"
  },
  "criteria": [
    {
      "id": "US027-01",
      "source": "Project Backlog row 28; US-031 row 32; Sprint Backlog III row 39",
      "requirement": "Block completion without at least one Proof attachment; Brief and Other do not qualify."
    },
    {
      "id": "US027-02",
      "source": "Project Backlog row 28; US-031 row 32; Sprint Backlog III row 39",
      "requirement": "Complete only an In Progress job with a valid selected Accepted offer, Paid payment and Proof."
    },
    {
      "id": "US027-03",
      "source": "Project Backlog row 28; US-031 row 32; Sprint Backlog III row 39",
      "requirement": "Keep status unchanged on rejection and reconcile unknown outcomes before retrying."
    }
  ],
  "outcomes": [
    [
      "success",
      "Completion confirmed"
    ],
    [
      "proof-missing",
      "Proof removed before completion"
    ],
    [
      "failed",
      "Completion rejected"
    ],
    [
      "unknown",
      "Response lost · outcome unknown"
    ],
    [
      "access",
      "Access denied"
    ]
  ],
  "scenarios": [
    {
      "id": "A01",
      "title": "Missing proof",
      "trigger": "Open an In Progress job with no Proof attachments.",
      "expected": "Show missing Proof and keep the job In Progress. Run completion check opens the blocked warning."
    },
    {
      "id": "A02",
      "title": "Completion blocked warning",
      "trigger": "Attempt completion with no Proof.",
      "expected": "Use a compact Requirements incomplete dialog, short blocker list and clear proof route. Keep status unchanged; avoid repeated paragraphs and competing recovery buttons."
    },
    {
      "id": "A03",
      "title": "All requirements met",
      "trigger": "A Proof record, Paid payment and correct Accepted offer exist.",
      "expected": "Enable an explicit completion check; proof alone is not sufficient."
    },
    {
      "id": "A04",
      "title": "Confirm completion",
      "trigger": "Run completion check when all conditions are met.",
      "expected": "Confirm job identity and the final transition before sending a request."
    },
    {
      "id": "A05",
      "title": "Completion pending",
      "trigger": "Confirm completion.",
      "expected": "Submit once. Permit Close, Escape, outside dismissal and Continue browsing while preserving the operation and View progress. A 12-second deadline or document return becomes unknown/check state with no automatic resubmission."
    },
    {
      "id": "A06",
      "title": "Completion confirmed",
      "trigger": "Receive a confirmed completion response.",
      "expected": "Show Completed and remove the completion mutation."
    },
    {
      "id": "B01",
      "title": "Payment is not Paid",
      "trigger": "Proof exists but payment is unpaid.",
      "expected": "Show the missing payment prerequisite and block completion."
    },
    {
      "id": "B02",
      "title": "Accepted offer mismatch",
      "trigger": "The selected offer is not a valid Accepted offer for this job.",
      "expected": "Explain the offer prerequisite and keep status unchanged."
    },
    {
      "id": "B03",
      "title": "Job has not started",
      "trigger": "The job is Accepted.",
      "expected": "Do not expose a completion request for an unstarted job."
    },
    {
      "id": "B04",
      "title": "Cancelled job",
      "trigger": "Read a Cancelled job.",
      "expected": "Keep the terminal state read-only."
    },
    {
      "id": "R01",
      "title": "Unknown completion outcome",
      "trigger": "The completion response is lost.",
      "expected": "Offer a read-only status check; never automatically repeat completion."
    },
    {
      "id": "R02",
      "title": "Requirements unavailable",
      "trigger": "A job read fails.",
      "expected": "Show read failure rather than known prerequisites and disable completion."
    },
    {
      "id": "R03",
      "title": "Access removed",
      "trigger": "Access is denied.",
      "expected": "Remove all private job and delivery data."
    },
    {
      "id": "R04",
      "title": "Requirements loading",
      "trigger": "The initial requirements read is pending.",
      "expected": "Announce the read and prevent completion until resolved."
    }
  ],
  "presentationDecisions": {
    "revision": "1.6.0",
    "source": "../../book/README.md",
    "principles": "../../book/PRINCIPLES.md",
    "precedence": "Current human UX/UI guidance supersedes older presentation defaults; domain prerequisites remain unchanged.",
    "loading": "Close presentation without claiming rollback; keep background result/reopen affordance, 12-second unknown/read recovery and a same-tab fictional operation journal. Never replay a write on return.",
    "pagination": "Omit Previous entirely on the first page and Next on the last page.",
    "copy": "Keep only meaningful consequences, validation, uncertainty and next steps; do not repeat a visible status."
  }
};
