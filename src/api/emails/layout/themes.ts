const SYSTEM_FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO_FONT = "Menlo, Consolas, 'Courier New', monospace";

export type EmailTheme = {
  ground: string;
  pageInk: string;
  footerInk: string;
  ticket: string;
  ink: string;
  stubInk: string;
  accent: string;
  dash: string;
  dashWidth: number;
  frame: string;
  frameWidth: number;
  frameBottomWidth: number;
  radius: number;
  buttonFill: string;
  buttonInk: string;
  buttonEdge: string;
  buttonRadius: number;
  bodyFont: string;
  monoFont: string;
  displayFont: string;
  leadFont: string;
  leadSize: number;
  fontUrl: string;
  logo: string | null;
};

export const arcadeTheme: EmailTheme = {
  ground: "#6A3FC8",
  pageInk: "#FFFFFF",
  footerInk: "#FFFFFF",
  ticket: "#FFD84D",
  ink: "#0B2E59",
  stubInk: "#0B2E59",
  accent: "#6A3FC8",
  dash: "#0B2E59",
  dashWidth: 4,
  frame: "#0B2E59",
  frameWidth: 4,
  frameBottomWidth: 12,
  radius: 24,
  buttonFill: "#FFD84D",
  buttonInk: "#0B2E59",
  buttonEdge: "#0B2E59",
  buttonRadius: 20,
  bodyFont: SYSTEM_FONT,
  monoFont: MONO_FONT,
  displayFont: `'Madimi One', Arial, sans-serif`,
  leadFont: SYSTEM_FONT,
  leadSize: 18,
  fontUrl: "https://fonts.googleapis.com/css2?family=Madimi+One&display=swap",
  logo: "kilist",
};

export const versusTheme: EmailTheme = {
  ground: "#16122E",
  pageInk: "#D6D1F0",
  footerInk: "#B7B0D9",
  ticket: "#221C44",
  ink: "#FFFFFF",
  stubInk: "#FF9CC6",
  accent: "#FFD23F",
  dash: "#3A3266",
  dashWidth: 3,
  frame: "#221C44",
  frameWidth: 0,
  frameBottomWidth: 0,
  radius: 28,
  buttonFill: "#FFD23F",
  buttonInk: "#16122E",
  buttonEdge: "#A88512",
  buttonRadius: 16,
  bodyFont: SYSTEM_FONT,
  monoFont: MONO_FONT,
  displayFont: `Bungee, Impact, Arial, sans-serif`,
  leadFont: SYSTEM_FONT,
  leadSize: 21,
  fontUrl: "https://fonts.googleapis.com/css2?family=Bungee&display=swap",
  logo: null,
};

export const roastTheme: EmailTheme = {
  ground: "#0A0A0A",
  pageInk: "#FFFFFF",
  footerInk: "#B0B0B0",
  ticket: "#D7FF3E",
  ink: "#0A0A0A",
  stubInk: "#0A0A0A",
  accent: "#0A0A0A",
  dash: "#0A0A0A",
  dashWidth: 4,
  frame: "#D7FF3E",
  frameWidth: 0,
  frameBottomWidth: 0,
  radius: 0,
  buttonFill: "#FF4D1F",
  buttonInk: "#0A0A0A",
  buttonEdge: "#FF4D1F",
  buttonRadius: 0,
  bodyFont: SYSTEM_FONT,
  monoFont: MONO_FONT,
  displayFont: `Anton, Impact, 'Arial Narrow', Arial, sans-serif`,
  leadFont: `Anton, Impact, 'Arial Narrow', Arial, sans-serif`,
  leadSize: 36,
  fontUrl: "https://fonts.googleapis.com/css2?family=Anton&display=swap",
  logo: null,
};
