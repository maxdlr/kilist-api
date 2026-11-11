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
  logoSize: number;
  titleSize: number;
  strongWeight: number;
  noteInk: string;
  noteWeight: number;
  leadInk: string;
  buttonSize: number;
  buttonPadding: number;
  buttonBorder: number;
  buttonBottom: number;
  stroke: number;
  avatarFill: string;
  rule: string;
  ruleWidth: number;
  item: { fill: string; line: string; border: number; bottom: number; radius: number };
};

const calm = tokens.calm;
const versus = tokens.versus;
const roast = tokens.roast;

const INTER_FONT = `Inter, ${SYSTEM_FONT}`;

const loud = (ink: string) => ({
  logoSize: 36,
  titleSize: 26,
  strongWeight: 800,
  noteInk: ink,
  noteWeight: 700,
  leadInk: "#FFFFFF",
  buttonSize: 20,
  buttonPadding: 18,
  buttonBorder: 3,
  buttonBottom: 8,
  stroke: 4,
  avatarFill: "#FFFFFF",
  rule: ink,
  ruleWidth: 2,
  item: { fill: "#FFFFFF", line: ink, border: 3, bottom: 6, radius: 14 },
});

export const calmTheme: EmailTheme = {
  ground: calm.colors.ground,
  pageInk: calm.colors.onGround,
  footerInk: calm.colors.muted,
  ticket: calm.colors.paper,
  ink: calm.colors.onPaper,
  stubInk: calm.colors.muted,
  accent: calm.colors.onPaper,
  dash: calm.panelLine,
  dashWidth: calm.border,
  frame: calm.panelLine,
  frameWidth: calm.border,
  frameBottomWidth: calm.border,
  radius: calm.panelRadius,
  buttonFill: calm.primary.fill,
  buttonInk: calm.primary.ink,
  buttonEdge: calm.primary.line,
  buttonRadius: calm.radius,
  bodyFont: INTER_FONT,
  monoFont: INTER_FONT,
  displayFont: INTER_FONT,
  leadFont: INTER_FONT,
  leadSize: 17,
  fontUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
  logo: "Kilist",
  logoSize: 18,
  titleSize: 24,
  strongWeight: 600,
  noteInk: calm.colors.muted,
  noteWeight: 400,
  leadInk: calm.colors.onGround,
  buttonSize: 16,
  buttonPadding: 16,
  buttonBorder: calm.border,
  buttonBottom: calm.border,
  stroke: calm.border,
  avatarFill: calm.colors.raised,
  rule: calm.panelLine,
  ruleWidth: calm.border,
  item: { fill: calm.colors.raised, line: calm.colors.raised, border: calm.border, bottom: calm.border, radius: calm.radius },
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
  ...loud(versus.colors.onGround),
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
  ...loud(roast.colors.onPaper),
};
