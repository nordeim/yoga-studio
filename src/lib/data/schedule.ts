/**
 * Schedule — the week's classes.
 * Seats are modelled explicitly so the dot indicator and the
 * availability text always agree. `total` is the class capacity;
 * `taken` is the number of mats already reserved.
 */

export interface ScheduleClass {
  id: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  time: string;
  className: string;
  classNote?: string;
  teacher: string;
  room: string;
  roomNote?: string;
  bring: string;
  bringNote?: string;
  prep: string;
  total: number;
  taken: number;
}

export const SCHEDULE: readonly ScheduleClass[] = [
  {
    id: "mon-700-vinyasa",
    day: "Mon",
    time: "7:00 AM",
    className: "Slow Vinyasa",
    teacher: "Anya Perrin",
    room: "Sun Room · 74°F",
    roomNote: "north-facing with tall windows",
    bring: "Water. We provide the mat, two blankets, and a bolster.",
    bringNote: "Arrive ten minutes early.",
    prep: "Light breakfast is fine. No perfume, please — we share the air.",
    total: 8,
    taken: 3,
  },
  {
    id: "mon-630-restorative",
    day: "Mon",
    time: "6:30 PM",
    className: "Restorative",
    classNote: "· full",
    teacher: "Marcus Reed",
    room: "Cedar Room · 68°F",
    roomNote: "cool, north-facing, low light",
    bring: "Socks and a long-sleeve layer. You will be still for long stretches.",
    bringNote: "Everything else is provided.",
    prep: "Avoid caffeine for two hours beforehand. Empty stomach is ideal but not required.",
    total: 6,
    taken: 6,
  },
  {
    id: "tue-700-vinyasa",
    day: "Tue",
    time: "7:00 AM",
    className: "Slow Vinyasa",
    teacher: "Anya Perrin",
    room: "Sun Room · 74°F",
    roomNote: "north-facing with tall windows",
    bring: "Water. Mat and props provided.",
    bringNote: "Arrive ten minutes early.",
    prep: "Light breakfast is fine. No perfume, please.",
    total: 8,
    taken: 5,
  },
  {
    id: "tue-1200-midday",
    day: "Tue",
    time: "12:00 PM",
    className: "Midday Reset",
    classNote: "· 45 min",
    teacher: "Marcus Reed",
    room: "Cedar Room · 70°F",
    bring: "Comfortable clothes you can move in.",
    bringNote: "Perfect for the lunch hour.",
    prep: "A mix of gentle flow, breathwork, and a long savasana. Designed to fit into a workday.",
    total: 8,
    taken: 4,
  },
  {
    id: "tue-730-breathwork",
    day: "Tue",
    time: "7:30 PM",
    className: "Breathwork",
    teacher: "Iris Tanaka",
    room: "Sun Room · 72°F",
    roomNote: "candles, eye pillows, low light",
    bring: "Nothing. Everything is provided.",
    bringNote: "Wear layers — body temperature drops.",
    prep: "Avoid eating heavily for two hours before. Caffeine will make this harder.",
    total: 10,
    taken: 6,
  },
  {
    id: "wed-700-yin",
    day: "Wed",
    time: "7:00 AM",
    className: "Yin",
    teacher: "Marcus Reed",
    room: "Cedar Room · 70°F",
    roomNote: "quiet, low light",
    bring: "Layers. Two blankets and a bolster are at your mat.",
    bringNote: "Arrive ten minutes early.",
    prep: "Warm muscles respond better — a hot shower beforehand helps.",
    total: 6,
    taken: 1,
  },
  {
    id: "wed-630-vinyasa",
    day: "Wed",
    time: "6:30 PM",
    className: "Slow Vinyasa",
    classNote: "· 75 min",
    teacher: "Anya Perrin",
    room: "Sun Room · 75°F",
    bring: "Water and a hand towel.",
    bringNote: "Mat and props provided.",
    prep: "Our flagship 75-minute sequence. Expect long holds and patient transitions.",
    total: 8,
    taken: 7,
  },
  {
    id: "thu-730-breathwork",
    day: "Thu",
    time: "7:30 PM",
    className: "Breathwork",
    classNote: "· 60 min",
    teacher: "Iris Tanaka",
    room: "Sun Room · 72°F",
    roomNote: "candles, low light",
    bring: "Layers.",
    bringNote: "Eye pillow and blanket provided.",
    prep: "Empty-ish stomach. No caffeine for three hours.",
    total: 10,
    taken: 8,
  },
  {
    id: "sat-900-long",
    day: "Sat",
    time: "9:00 AM",
    className: "Long Practice",
    classNote: "· 120 min · both rooms",
    teacher: "Anya & Iris",
    room: "Both rooms open",
    roomNote: "followed by tea in the kitchen",
    bring: "Layers, water, and a friend if you like.",
    bringNote: "Stay for tea afterward.",
    prep: "Two hours of slow vinyasa, long yin, breathwork, and a twenty-minute savasana. The week's anchor.",
    total: 12,
    taken: 9,
  },
  {
    id: "sun-900-restorative",
    day: "Sun",
    time: "9:00 AM",
    className: "Restorative",
    teacher: "Marcus Reed",
    room: "Cedar Room · 68°F",
    roomNote: "cool and dim",
    bring: "Socks, a long-sleeve layer.",
    bringNote: "Everything else provided.",
    prep: "The slowest class of the week. Ninety minutes, almost entirely on the floor.",
    total: 6,
    taken: 4,
  },
] as const;

export const PREFERRED_DAYS = [
  "Weekday morning",
  "Weekday midday",
  "Weekday evening",
  "Saturday Long Practice",
  "Sunday Restorative",
  "Not sure — please advise",
] as const;

export type PreferredDay = (typeof PREFERRED_DAYS)[number];
