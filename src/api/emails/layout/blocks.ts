import { escapeHtml } from "../helpers";
import { EmailTheme } from "./themes";

export type EmailBlock = { html: string; text: string };

const AVATAR_SIZE = 76;

export const codeBlock = (code: string, theme: EmailTheme): EmailBlock => ({
  html: `<div class="k-code" style="font-family:${theme.monoFont};font-size:56px;line-height:1;font-weight:700;letter-spacing:4px;color:${theme.ink};">${escapeHtml(code)}</div>`,
  text: code,
});

export const wordBlock = (word: string, theme: EmailTheme): EmailBlock => ({
  html: `<div class="k-code" style="font-family:${theme.monoFont};font-size:48px;line-height:1;font-weight:700;color:${theme.ink};">${escapeHtml(word)}</div>`,
  text: word,
});

export const skinNameBlock = (name: string, theme: EmailTheme): EmailBlock => ({
  html: `<div class="k-skin" style="font-family:${theme.displayFont};font-size:60px;line-height:1.05;font-weight:400;color:${theme.accent};">${escapeHtml(name)}</div>`,
  text: name,
});

const avatar = (initial: string | null, filled: boolean, theme: EmailTheme) => {
  const look = initial === null
    ? `border:4px dashed ${theme.ink};`
    : filled
      ? `background:${theme.ink};color:${theme.ticket};`
      : `background:#FFFFFF;border:4px solid ${theme.ink};color:${theme.ink};`;

  return `<td width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" align="center" valign="middle" style="box-sizing:border-box;width:${AVATAR_SIZE}px;height:${AVATAR_SIZE}px;border-radius:${AVATAR_SIZE / 2}px;font-family:${theme.bodyFont};font-size:36px;font-weight:800;${look}">${escapeHtml(initial ?? "")}</td>`;
};

const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

export const playersBlock = (you: string, other: string | null, theme: EmailTheme): EmailBlock => {
  const joiner = other
    ? `<td style="padding:0 12px;font-family:${theme.bodyFont};font-size:36px;font-weight:800;color:${theme.ink};">+</td>`
    : `<td style="width:22px;"></td>`;

  return {
    html: `<table role="presentation" aria-hidden="true" cellpadding="0" cellspacing="0" border="0" align="center"><tr>${avatar(initialOf(you), true, theme)}${joiner}${avatar(other && initialOf(other), false, theme)}</tr></table>`,
    text: "",
  };
};

export const rowsBlock = (rows: { label: string; value: string }[], theme: EmailTheme): EmailBlock => ({
  html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows
    .map(
      (row) =>
        `<tr><td align="left" style="padding:10px 0;border-bottom:2px solid ${theme.ink};font-family:${theme.monoFont};font-size:15px;color:${theme.ink};">${escapeHtml(row.label)}</td><td align="right" style="padding:10px 0;border-bottom:2px solid ${theme.ink};font-family:${theme.monoFont};font-size:15px;font-weight:700;color:${theme.ink};">${escapeHtml(row.value)}</td></tr>`,
    )
    .join("")}</table>`,
  text: rows.map((row) => `${row.label}: ${row.value}`).join("\n"),
});

export const numberedBlock = (items: string[], theme: EmailTheme): EmailBlock => ({
  html: items
    .map(
      (item, index) =>
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;background:#FFFFFF;border:3px solid ${theme.ink};border-bottom-width:6px;border-radius:14px;"><tr><td width="44" style="padding:10px 0 10px 12px;font-family:${theme.monoFont};font-size:14px;font-weight:700;color:${theme.ink};">${String(index + 1).padStart(2, "0")}</td><td align="left" style="padding:10px 12px;font-family:${theme.bodyFont};font-size:16px;line-height:1.25;font-weight:700;color:${theme.ink};">${escapeHtml(item)}</td></tr></table>`,
    )
    .join(""),
  text: items.map((item, index) => `${index + 1}. ${item}`).join("\n"),
});
