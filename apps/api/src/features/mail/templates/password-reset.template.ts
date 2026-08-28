export function buildPasswordResetEmail(params: { resetUrl: string; appName?: string }): { subject: string; html: string } {
  const appName = params.appName ?? 'Medicail';
  return {
    subject: `${appName} - Reinitialisation du mot de passe`,
    html: `
      <p>Bonjour,</p>
      <p>Vous avez demande la reinitialisation de votre mot de passe ${appName}.</p>
      <p><a href="${params.resetUrl}">Reinitialiser mon mot de passe</a></p>
      <p>Ce lien expire dans 1 heure. Si vous n'etes pas a l'origine de cette demande, ignorez cet e-mail.</p>
    `.trim(),
  };
}
