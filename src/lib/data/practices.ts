/**
 * Practices — the four ways to come home.
 * Static content; lives outside the DB because it changes ~annually
 * and never participates in transactions.
 */

export interface Practice {
  id: string;
  num: string;
  name: string;
  sanskrit: string;
  description: string;
  meta: { duration: string; room: string; level: string };
}

export const PRACTICES: readonly Practice[] = [
  {
    id: "vinyasa",
    num: "— 01",
    name: "Vinyasa",
    sanskrit: "nyāsa · to place, with care",
    description:
      "Movement woven to the breath in a slow, intelligent sequence. We build heat without urgency — one pose revealed at a time, never more than your body is ready to receive today.",
    meta: { duration: "60 minutes", room: "Sun Room", level: "All levels" },
  },
  {
    id: "yin",
    num: "— 02",
    name: "Yin",
    sanskrit: "the hidden, the inward",
    description:
      "Long-held floor poses, three to seven minutes each, that gently stress the deep connective tissue of hips, spine, and pelvis. A practice of patience — the body opens when it is ready, not before.",
    meta: { duration: "75 minutes", room: "Cedar Room", level: "All levels" },
  },
  {
    id: "restorative",
    num: "— 03",
    name: "Restorative",
    sanskrit: "to make whole again",
    description:
      "Twenty poses in ninety minutes, almost all of them on the floor, fully supported by bolsters, blankets, and blocks. The nervous system is given the conditions to leave alert mode. Nothing is asked of you.",
    meta: { duration: "90 minutes", room: "Sun Room", level: "Six mats only" },
  },
  {
    id: "breathwork",
    num: "— 04",
    name: "Breathwork",
    sanskrit: "prāṇāyāma · the extension of breath",
    description:
      "Forty-five minutes of guided breathing, lying down, eyes covered. We work with three patterns — balancing, lengthening, and release — and let the breath do what it has always known how to do.",
    meta: { duration: "45 minutes", room: "Sun Room", level: "Beginner friendly" },
  },
] as const;
