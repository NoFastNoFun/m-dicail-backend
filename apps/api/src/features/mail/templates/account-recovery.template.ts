import {
  buildEmailButton,
  buildEmailShell,
  emailMutedParagraph,
  emailParagraph,
} from './email-layout.template';

export function buildAccountRecoveryEmail(params: {
  recoveryUrl: string;
  appName?: string;
}): { subject: string; html: string } {
  const appName = params.appName ?? 'Medicail';
  const bodyHtml = [
    emailParagraph(`Bonjour,`),
    emailParagraph(
      `Vous avez demande la recuperation de votre compte ${appName}. Cliquez sur le bouton ci-dessous pour continuer.`,
    ),
    buildEmailButton({
      href: params.recoveryUrl,
      label: 'Recuperer mon compte',
    }),
    emailMutedParagraph(
      `Ce lien expire dans 1 heure. La recuperation desactivera l'authentification TOTP sur votre compte.`,
    ),
    emailMutedParagraph(
      `Si vous n'etes pas a l'origine de cette demande, ignorez cet e-mail.`,
    ),
  ].join('\n');

  return {
    subject: `${appName} - Recuperation de compte`,
    html: buildEmailShell({
      appName,
      preheader: "Recuperez l'acces a votre compte Medicail. Lien valable 1 heure.",
      title: 'Recuperation de compte',
      bodyHtml,
      footerNote: "Cette action desactive le TOTP jusqu'a une nouvelle configuration.",
    }),
  };
}
