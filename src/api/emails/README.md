# Emails

- **Change the wording:** `content/en.ts` and `content/fr.ts`. Plain text only; the layout handles escaping.
- **Preview:** in the app under Admin → Emails, or in dev at `/emails/preview`. Add `&format=text` to a preview link to see the plain-text version.
- **Change the look:** `layout/themes.ts` for colours and fonts, `layout/blocks.ts` for the main ticket content, `layout/ticket.ts` for the structure.
- **Add an email:** add its wording to both content files, its values to `EmailVars` and `PREVIEWS`, and its template to `templates.ts`.
- **Send one:** `sendEmail(user.email, "passwordReset", vars, emailLang(user), user.id)`. It throws if the provider fails, so catch it where a failed email shouldn't break the request.
- **History:** every attempt is logged in `email_logs` and shown in the admin panel under Emails. Subjects and bodies are not stored, because they can hold reset codes.
