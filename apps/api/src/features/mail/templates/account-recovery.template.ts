export function buildAccountRecoveryEmail(params: { recoveryUrl: string; appName?: string }): { subject: string; html: string } {
  const appName = params.appName ?? 'Medicail';
  return {
    subject: `${appName} - Recuperation de compte`,
    html: `
      <p>Bonjour,</p>
      <p>Vous avez demande la recuperation de votre compte ${appName}.</p>
      <p><a href="${params.recoveryUrl}">Recuperer mon compte</a></p>
      <p>Ce lien expire dans 1 heure. La recuperation desactivera l'authentification TOTP sur votre compte.</p>
      <p>Si vous n'etes pas a l'origine de cette demande, ignorez cet e-mail.</p>
    `.trim(),
  };
}
