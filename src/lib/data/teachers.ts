/**
 * Teachers — the people who hold the room.
 * Three teachers, forty-one years of practice between them.
 */

export interface Teacher {
  id: string;
  name: string;
  role: string;
  yearsLabel: string;
  photo: {
    src: string;
    alt: string;
  };
  /** The "why I teach" quote — typed out character-by-character on hover/tap. */
  quote: string;
}

export const TEACHERS: readonly Teacher[] = [
  {
    id: "anya",
    name: "Anya Perrin",
    role: "Vinyasa · Lead Teacher · 21 yrs",
    yearsLabel: "21 years",
    photo: {
      src: "https://picsum.photos/seed/yoga-teacher-anya-portrait/600/750",
      alt: "Anya Perrin, lead teacher",
    },
    quote:
      "I came to yoga in 2003, after a car accident that ended my running. The first six months I cried in every savasana. I teach because movement is the oldest language I know — older than words, older than thought. When a student finds the breath inside a pose, I have done my work.",
  },
  {
    id: "marcus",
    name: "Marcus Reed",
    role: "Yin · Restorative · 14 yrs",
    yearsLabel: "14 years",
    photo: {
      src: "https://picsum.photos/seed/yoga-teacher-marcus-portrait/600/750",
      alt: "Marcus Reed, yin and restorative teacher",
    },
    quote:
      "Stillness is not the absence of motion. It is the listening that motion leaves behind. I teach yin because most of us have been told, our whole lives, that to rest is to fail. The mat is one of the last places we are allowed to do nothing — and to find that doing nothing is, in fact, the work.",
  },
  {
    id: "iris",
    name: "Iris Tanaka",
    role: "Breathwork · Meditation · 9 yrs",
    yearsLabel: "9 years",
    photo: {
      src: "https://picsum.photos/seed/yoga-teacher-iris-portrait/600/750",
      alt: "Iris Tanaka, breathwork teacher",
    },
    quote:
      "The breath always knows. It knew before the meeting went badly, it knew before the email you wish you hadn't sent. My job is not to fix anyone's breathing — it is to make the room quiet enough, and the time long enough, that you can hear what yours has been trying to tell you for years.",
  },
] as const;
