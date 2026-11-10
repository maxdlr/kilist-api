import tokens from "./skinTokens.json";

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

const arcade = tokens.arcade;
const versus = tokens.versus;
const roast = tokens.roast;

export const arcadeTheme: EmailTheme = {
  ground: arcade.colors.ground,
  pageInk: arcade.colors.onGround,
  footerInk: arcade.colors.onGround,
  ticket: arcade.primary.fill,
  ink: arcade.colors.onPaper,
  stubInk: arcade.colors.onPaper,
  accent: arcade.colors.ground,
  dash: arcade.colors.onPaper,
  dashWidth: 4,
  frame: arcade.colors.onPaper,
  frameWidth: 4,
  frameBottomWidth: 12,
  radius: arcade.radius,
  buttonFill: arcade.primary.fill,
  buttonInk: arcade.primary.ink,
  buttonEdge: arcade.primary.line,
  buttonRadius: arcade.radius - 2,
  bodyFont: SYSTEM_FONT,
  monoFont: MONO_FONT,
  displayFont: `'Madimi One', Arial, sans-serif`,
  leadFont: SYSTEM_FONT,
  leadSize: 18,
  fontUrl: "https://fonts.googleapis.com/css2?family=Madimi+One&display=swap",
  logo: "kilist",
};

export const versusTheme: EmailTheme = {
  ground: versus.colors.ground,
  pageInk: "#D6D1F0",
  footerInk: versus.colors.muted,
  ticket: versus.colors.raised,
  ink: versus.colors.onGround,
  stubInk: "#FF9CC6",
  accent: versus.primary.fill,
  dash: "#3A3266",
  dashWidth: 3,
  frame: versus.colors.raised,
  frameWidth: 0,
  frameBottomWidth: 0,
  radius: versus.panelRadius,
  buttonFill: versus.primary.fill,
  buttonInk: versus.primary.ink,
  buttonEdge: "#A88512",
  buttonRadius: versus.radius - 2,
  bodyFont: SYSTEM_FONT,
  monoFont: MONO_FONT,
  displayFont: `Bungee, Impact, Arial, sans-serif`,
  leadFont: SYSTEM_FONT,
  leadSize: 21,
  fontUrl: "https://fonts.googleapis.com/css2?family=Bungee&display=swap",
  logo: null,
};

export const roastTheme: EmailTheme = {
  ground: roast.colors.ground,
  pageInk: roast.colors.onGround,
  footerInk: roast.colors.muted,
  ticket: roast.colors.accent,
  ink: roast.colors.onPaper,
  stubInk: roast.colors.onPaper,
  accent: roast.colors.onPaper,
  dash: roast.colors.onPaper,
  dashWidth: 4,
  frame: roast.colors.accent,
  frameWidth: 0,
  frameBottomWidth: 0,
  radius: roast.radius,
  buttonFill: roast.colors.alert,
  buttonInk: roast.colors.onAlert,
  buttonEdge: roast.colors.alert,
  buttonRadius: roast.radius,
  bodyFont: SYSTEM_FONT,
  monoFont: MONO_FONT,
  displayFont: `Anton, Impact, 'Arial Narrow', Arial, sans-serif`,
  leadFont: `Anton, Impact, 'Arial Narrow', Arial, sans-serif`,
  leadSize: 36,
  fontUrl: "https://fonts.googleapis.com/css2?family=Anton&display=swap",
  logo: null,
};
