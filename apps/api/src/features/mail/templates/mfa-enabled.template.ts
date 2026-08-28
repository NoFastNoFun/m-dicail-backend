export function buildMfaEnabledEmail(params: { appName?: string }): { subject: string; html: string } {
  const appName = params.appName ?? 'Medicail';
  return {
    subject: `${appName} - Authentification a deux facteurs activee`,
    html: `
      <p>Bonjour,</p>
      <p>L'authentification a deux facteurs (TOTP) a ete activee sur votre compte ${appName}.</p>
      <p>Conservez vos codes de recuperation en lieu sur. Ils vous permettront de retrouver l'acces si vous perdez votre application d'authentification.</p>
    `.trim(),
  };
}
