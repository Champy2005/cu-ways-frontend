import type { Invitation, Offer } from "../types";

export const DEMO_NOW = "2026-10-07T12:00:00Z";

const campaign = {
  id: "JOB-2026-041",
  title: "Campus Sustainability Campaign",
  budget: "8500.00",
  deadline: "2026-10-28",
  target: 350,
  surveys: [
    { title: "Campus Mobility Study", url: null },
    { title: "Green Habits 2026", url: null },
  ],
  brief: {
    title: "Campaign Brief v2",
    text: "Help us reach 350 Chulalongkorn students across faculties. Share the linked surveys through student communities and campus outreach. Deliver a summary of your distribution channels before 28 October. This is a fictional brief for the local preview.",
  },
};

function invitation(id: string, overrides: Partial<Invitation> = {}): Invitation {
  return {
    id,
    creator: "Faculty of Engineering",
    job: campaign,
    message:
      "Hi! We noticed your great track record with engineering students. We would love to have you on this project.",
    invitedAt: "2026-10-03T10:00:00Z",
    status: "Pending",
    respondedAt: null,
    declineReason: null,
    declineNote: "",
    ...overrides,
  };
}

export const initialInvitations: Invitation[] = [
  invitation("request-041"),
  invitation("request-052", {
    creator: "Faculty of Arts",
    message: "Looking for marketers with dormitory access for this health survey.",
    job: {
      ...campaign,
      id: "JOB-2026-052",
      title: "Student Wellness Survey 2026",
      budget: "5200.00",
      deadline: "2026-11-15",
      target: 200,
      surveys: [{ title: "Wellness Check", url: null }],
      brief: {
        title: "Project Brief",
        text: "Reach 200 students in campus dormitories. Share our wellness survey and provide a short outreach summary. Fictional preview content.",
      },
    },
  }),
  invitation("request-063", {
    status: "Accepted",
    respondedAt: "2026-10-06T12:00:00Z",
    creator: "Student Affairs",
    job: { ...campaign, id: "JOB-2026-063", title: "Campus Community Research" },
  }),
  invitation("request-074", {
    status: "Accepted",
    respondedAt: "2026-10-05T12:00:00Z",
    job: { ...campaign, id: "JOB-2026-074", title: "Student Transport Study" },
  }),
  invitation("request-085", {
    status: "Declined",
    respondedAt: "2026-10-04T12:00:00Z",
    declineReason: "Schedule conflict",
    declineNote: "I am already committed to another campaign.",
    job: { ...campaign, id: "JOB-2026-085", title: "Library Experience Survey" },
  }),
  invitation("request-096", {
    status: "Closed",
    job: { ...campaign, id: "JOB-2026-096", title: "Campus Dining Feedback" },
  }),
];

export const initialOffers: Offer[] = [
  {
    id: "offer-074",
    requestId: "request-074",
    price: "9000.00",
    deliveryDate: "2026-10-25",
    message: "I can reach students through faculty LINE groups and a campus booth.",
    status: "Pending",
    createdAt: "2026-10-06T12:00:00Z",
    withdrawnAt: null,
  },
];
