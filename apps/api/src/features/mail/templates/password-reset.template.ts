import {
  buildEmailButton,
  buildEmailShell,
  emailMutedParagraph,
  emailParagraph,
} from './email-layout.template';

export function buildPasswordResetEmail(params: {
  resetUrl: string;
  appName?: string;
}): { subject: string; html: string } {
  const appName = params.appName ?? 'Medicail';
  const bodyHtml = [
    emailParagraph(`Bonjour,`),
    emailParagraph(
      `Vous avez demande la reinitialisation de votre mot de passe ${appName}. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.`,
    ),
    buildEmailButton({
      href: params.resetUrl,
      label: 'Reinitialiser mon mot de passe',
    }),
    emailMutedParagraph(
      `Ce lien expire dans 1 heure. Si vous n'etes pas a l'origine de cette demande, ignorez cet e-mail.`,
    ),
  ].join('\n');

  return {
    subject: `${appName} - Reinitialisation du mot de passe`,
    html: buildEmailShell({
      appName,
      preheader: 'Reinitialisez votre mot de passe Medicail. Lien valable 1 heure.',
      title: 'Reinitialisation du mot de passe',
      bodyHtml,
      footerNote: 'Pour votre securite, ne partagez jamais ce lien.',
    }),
  };
}
