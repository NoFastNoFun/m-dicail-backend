import { buildEmailShell, emailMutedParagraph, emailParagraph } from './email-layout.template';

export function buildMfaEnabledEmail(params: { appName?: string }): { subject: string; html: string } {
  const appName = params.appName ?? 'Medicail';
  const bodyHtml = [
    emailParagraph(`Bonjour,`),
    emailParagraph(
      `L'authentification a deux facteurs (TOTP) a ete activee sur votre compte ${appName}.`,
    ),
    emailMutedParagraph(
      `Conservez vos codes de recuperation en lieu sur. Ils vous permettront de retrouver l'acces si vous perdez votre application d'authentification.`,
    ),
  ].join('\n');

  return {
    subject: `${appName} - Authentification a deux facteurs activee`,
    html: buildEmailShell({
      appName,
      preheader: 'La double authentification est activee sur votre compte Medicail.',
      title: 'Authentification a deux facteurs activee',
      bodyHtml,
      footerNote: "Si vous n'avez pas active le TOTP, contactez le support immediatement.",
    }),
  };
}
