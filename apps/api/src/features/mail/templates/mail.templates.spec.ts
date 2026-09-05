import { buildPasswordResetEmail } from './password-reset.template';
import { buildAccountRecoveryEmail } from './account-recovery.template';
import { buildMfaEnabledEmail } from './mfa-enabled.template';
import { escapeHtml } from './email-layout.template';

describe('mail templates', () => {
  it('escapeHtml encodes markup-sensitive characters', () => {
    expect(escapeHtml(`a<"b>&'c`)).toBe('a&lt;&quot;b&gt;&amp;&#39;c');
  });

  it('password reset email includes branded shell and CTA', () => {
    const { subject, html } = buildPasswordResetEmail({
      resetUrl: 'https://medicail.nf2.tech/reset-password?token=a"b',
    });

    expect(subject).toContain('Reinitialisation');
    expect(html).toContain('Medicail');
    expect(html).toContain('Reinitialiser mon mot de passe');
    expect(html).toContain('href="https://medicail.nf2.tech/reset-password?token=a&quot;b"');
    expect(html).toContain('expire dans 1 heure');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('account recovery email includes TOTP warning and CTA', () => {
    const { html } = buildAccountRecoveryEmail({
      recoveryUrl: 'https://medicail.nf2.tech/recovery?token=tok',
    });

    expect(html).toContain('Recuperer mon compte');
    expect(html).toContain('TOTP');
    expect(html).toContain('https://medicail.nf2.tech/recovery?token=tok');
  });

  it('mfa enabled email uses the shared shell', () => {
    const { html } = buildMfaEnabledEmail({});
    expect(html).toContain('Authentification a deux facteurs activee');
    expect(html).toContain('codes de recuperation');
    expect(html).toContain('Medicail');
  });
});
