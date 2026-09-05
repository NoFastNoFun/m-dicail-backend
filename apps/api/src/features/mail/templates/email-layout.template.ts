export type EmailShellParams = {
  appName: string;
  preheader: string;
  title: string;
  bodyHtml: string;
  footerNote?: string;
};

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function buildEmailButton(params: { href: string; label: string }): string {
  const href = escapeHtml(params.href);
  const label = escapeHtml(params.label);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
      <tr>
        <td align="center" bgcolor="#222222" style="border-radius:8px; background-color:#222222;">
          <a href="${href}"
             style="display:inline-block; padding:14px 28px; font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; font-size:15px; font-weight:600; line-height:1.2; color:#E9E9E9; text-decoration:none; border-radius:8px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px; font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:1.5; color:#9E9E9E;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br />
      <a href="${href}" style="color:#2673E2; word-break:break-all;">${href}</a>
    </p>
  `.trim();
}

export function buildEmailShell(params: EmailShellParams): string {
  const appName = escapeHtml(params.appName);
  const preheader = escapeHtml(params.preheader);
  const title = escapeHtml(params.title);
  const footerNote = params.footerNote
    ? `<p style="margin:0; font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:1.5; color:#9E9E9E;">${escapeHtml(params.footerNote)}</p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#F5F5F5;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    ${preheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F5F5; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#FFFFFF; border:1px solid #E0E0E0; border-radius:12px;">
          <tr>
            <td style="padding:28px 32px 8px; border-bottom:1px solid #E0E0E0;">
              <p style="margin:0; font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; font-size:13px; letter-spacing:0.08em; text-transform:uppercase; color:#616161;">
                ${appName}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 32px; font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#222222;">
              <h1 style="margin:0 0 16px; font-size:22px; line-height:1.3; font-weight:700; color:#222222;">
                ${title}
              </h1>
              ${params.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 24px; border-top:1px solid #E0E0E0; background-color:#FAFAFA; border-radius:0 0 12px 12px;">
              ${footerNote}
              <p style="margin:${params.footerNote ? '12px' : '0'} 0 0; font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:1.5; color:#9E9E9E;">
                Cet e-mail a ete envoye automatiquement par ${appName}. Merci de ne pas y repondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 14px; font-size:15px; line-height:1.6; color:#222222;">${escapeHtml(text)}</p>`;
}

export function emailMutedParagraph(text: string): string {
  return `<p style="margin:0 0 14px; font-size:14px; line-height:1.6; color:#616161;">${escapeHtml(text)}</p>`;
}
