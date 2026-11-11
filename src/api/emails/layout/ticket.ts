import { Lang } from "@/i18n";
import { escapeHtml } from "../helpers";
import { EmailBlock } from "./blocks";
import { EmailTheme } from "./themes";

export type EmailParts = {
  theme: EmailTheme;
  subject: string;
  preheader: string;
  stub?: string;
  title: string;
  hero: EmailBlock;
  note?: string;
  lead?: string;
  paragraphs?: string[];
  button?: { label: string; url: string };
  closing?: string;
  footer: string;
  footerLink?: { label: string; url: string };
};

export type RenderedEmail = { subject: string; preheader: string; html: string; text: string };

const MOBILE_WIDTH = 520;
const DESKTOP_WIDTH = 640;
const DESKTOP_BREAKPOINT = 600;
const SIDE_STUB_WIDTH = 72;

const stylesOf = (t: EmailTheme, stubbed: boolean) => `
  body { margin: 0; padding: 0; background: ${t.ground}; -webkit-text-size-adjust: 100%; }
  table { border-collapse: separate; }
  a { color: inherit; }
  @media only screen and (min-width: ${DESKTOP_BREAKPOINT}px) {
    .k-code { font-size: 64px !important; }
    .k-skin { font-size: 88px !important; }${stubbed ? stubStylesOf(t) : ""}
  }`;

const stubStylesOf = (t: EmailTheme) => `
    .k-ticket { max-width: ${DESKTOP_WIDTH}px !important; }
    .k-stub-row { display: none !important; }
    .k-stub-side { display: table-cell !important; width: ${SIDE_STUB_WIDTH}px !important; max-height: none !important; overflow: visible !important; }
    .k-main {
      border-left: ${t.dashWidth}px dashed ${t.dash} !important;
      border-right: ${t.dashWidth}px dashed ${t.dash} !important;
      border-top: ${t.frameWidth}px solid ${t.frame} !important;
      border-bottom: ${t.frameBottomWidth}px solid ${t.frame} !important;
    }`;

const sideStub = (stub: string, side: "left" | "right", t: EmailTheme) => {
  const edge = `border-${side}:${t.frameWidth}px solid ${t.frame};border-top:${t.frameWidth}px solid ${t.frame};border-bottom:${t.frameBottomWidth}px solid ${t.frame};`;
  const corners =
    side === "left"
      ? `border-radius:${t.radius}px 0 0 ${t.radius}px;`
      : `border-radius:0 ${t.radius}px ${t.radius}px 0;`;

  return `<td class="k-stub-side" aria-hidden="true" align="center" valign="middle" style="display:none;mso-hide:all;max-height:0;overflow:hidden;background:${t.ticket};${edge}${corners}padding:8px;font-family:${t.monoFont};font-size:12px;line-height:1.3;font-weight:700;letter-spacing:1px;color:${t.stubInk};">${escapeHtml(stub)}</td>`;
};

const stubRow = (stub: string, position: "top" | "bottom", t: EmailTheme) => {
  const bottom =
    position === "bottom"
      ? `border-bottom:${t.frameBottomWidth}px solid ${t.frame};border-radius:0 0 ${t.radius}px ${t.radius}px;`
      : "";

  return `<tr class="k-stub-row"><td colspan="3" aria-hidden="true" align="center" height="64" style="height:64px;background:${t.ticket};border-left:${t.frameWidth}px solid ${t.frame};border-right:${t.frameWidth}px solid ${t.frame};${bottom}font-family:${t.monoFont};font-size:15px;font-weight:700;letter-spacing:4px;color:${t.stubInk};">${escapeHtml(stub)}</td></tr>`;
};

const stubbedEdges = (t: EmailTheme) =>
  `border-left:${t.frameWidth}px solid ${t.frame};border-right:${t.frameWidth}px solid ${t.frame};border-top:${t.dashWidth}px dashed ${t.dash};border-bottom:${t.dashWidth}px dashed ${t.dash};`;

const plainEdges = (t: EmailTheme) =>
  `border:${t.frameWidth}px solid ${t.frame};border-bottom-width:${t.frameBottomWidth}px;border-radius:${t.radius}px;`;

const paragraph = (value: string, size: number, t: EmailTheme) =>
  `<p style="margin:0 0 16px;font-family:${t.bodyFont};font-size:${size}px;line-height:1.5;color:${t.pageInk};">${escapeHtml(value)}</p>`;

const buttonOf = (button: NonNullable<EmailParts["button"]>, t: EmailTheme) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;"><tr><td align="center" style="background:${t.buttonFill};border:${t.buttonBorder}px solid ${t.buttonEdge};border-bottom-width:${t.buttonBottom}px;border-radius:${t.buttonRadius}px;"><a href="${escapeHtml(button.url)}" style="display:block;padding:${t.buttonPadding}px 24px;font-family:${t.bodyFont};font-size:${t.buttonSize}px;line-height:1.2;font-weight:${t.strongWeight};color:${t.buttonInk};text-decoration:none;">${escapeHtml(button.label)}</a></td></tr></table>`;

export const renderTicket = (parts: EmailParts, lang: Lang): RenderedEmail => {
  const { theme: t, stub, title, hero, note, lead, paragraphs = [], button, closing, footer, footerLink } = parts;

  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(parts.subject)}</title>
<link rel="stylesheet" href="${t.fontUrl}">
<style>${stylesOf(t, Boolean(stub))}</style>
</head>
<body>
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(parts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${t.ground};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" class="k-ticket" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${MOBILE_WIDTH}px;">
${stub ? stubRow(stub, "top", t) : ""}
<tr>
${stub ? sideStub(stub, "left", t) : ""}
<td class="k-main" align="center" style="background:${t.ticket};${stub ? stubbedEdges(t) : plainEdges(t)}padding:32px 24px;">
${t.logo ? `<div style="font-family:${t.displayFont};font-size:${t.logoSize}px;line-height:1;font-weight:${t.strongWeight};color:${t.ink};padding-bottom:18px;">${escapeHtml(t.logo)}</div>` : ""}
<h1 style="margin:0 0 18px;font-family:${t.bodyFont};font-size:${t.titleSize}px;line-height:1.15;font-weight:${t.strongWeight};color:${t.ink};">${escapeHtml(title)}</h1>
${hero.html}
${note ? `<div style="padding-top:18px;font-family:${t.bodyFont};font-size:15px;line-height:1.4;font-weight:${t.noteWeight};color:${t.noteInk};">${escapeHtml(note)}</div>` : ""}
</td>
${stub ? sideStub(stub, "right", t) : ""}
</tr>
${stub ? stubRow(stub, "bottom", t) : ""}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${MOBILE_WIDTH}px;">
<tr><td align="center" style="padding-top:28px;">
${lead ? `<p style="margin:0 0 16px;font-family:${t.leadFont};font-size:${t.leadSize}px;line-height:1.2;font-weight:700;color:${t.leadInk};">${escapeHtml(lead)}</p>` : ""}
${paragraphs.map((value, index) => paragraph(value, index === 0 ? 17 : 15, t)).join("\n")}
${button ? buttonOf(button, t) : ""}
${closing ? paragraph(closing, 15, t) : ""}
<p style="margin:0;font-family:${t.bodyFont};font-size:13px;line-height:1.5;color:${t.footerInk};">${escapeHtml(footer).replace(/[^\s@]+@[^\s@]+\.[a-z]{2,}/gi, (address) => `<a href="mailto:${address}" style="color:${t.footerInk};text-decoration:none;">${address}</a>`)}${footerLink ? ` <a href="${escapeHtml(footerLink.url)}" style="color:${t.footerInk};">${escapeHtml(footerLink.label)}</a>` : ""}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    title,
    hero.text,
    note,
    lead,
    ...paragraphs,
    button && `${button.label}: ${button.url}`,
    closing,
    footer,
    footerLink && `${footerLink.label}: ${footerLink.url}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { subject: parts.subject, preheader: parts.preheader, html, text };
};
