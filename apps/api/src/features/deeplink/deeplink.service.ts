import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/services/mail.service';

export type DeeplinkPath = 'reset-password' | 'recovery';

@Injectable()
export class DeeplinkService {
  constructor(private readonly mailService: MailService) {}

  buildAppUrl(path: DeeplinkPath, token?: string): string {
    const scheme = this.mailService.getDeeplinkScheme();
    const base = `${scheme}://${path}`;
    if (!token) {
      return base;
    }
    return `${base}?token=${encodeURIComponent(token)}`;
  }

  buildBounceHtml(path: DeeplinkPath, token?: string): string {
    const deeplink = this.buildAppUrl(path, token);
    const href = escapeHtml(deeplink);
    const jsUrl = JSON.stringify(deeplink);
    const hasToken = Boolean(token && token.trim().length > 0);

    const body = hasToken
      ? `
      <p>Ouverture de Medicail…</p>
      <p>Si l'application ne s'ouvre pas, <a href="${href}">cliquez ici</a>.</p>
    `
      : `
      <p>Lien invalide ou incomplete.</p>
      <p>Rouvrez le lien depuis votre e-mail, ou <a href="${href}">ouvrez Medicail</a>.</p>
    `;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${hasToken ? `<meta http-equiv="refresh" content="0;url=${href}" />` : ''}
  <title>Medicail</title>
  ${hasToken ? `<script>window.location.replace(${jsUrl});</script>` : ''}
</head>
<body>
  ${body.trim()}
</body>
</html>
    `.trim();
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
