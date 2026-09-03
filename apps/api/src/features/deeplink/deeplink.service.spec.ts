import { DeeplinkService } from './deeplink.service';

describe('DeeplinkService', () => {
  const mailService = {
    getDeeplinkScheme: jest.fn().mockReturnValue('medicail'),
  };
  const service = new DeeplinkService(mailService as never);

  beforeEach(() => {
    mailService.getDeeplinkScheme.mockReturnValue('medicail');
  });

  it('builds a custom-scheme reset URL with an encoded token', () => {
    expect(service.buildAppUrl('reset-password', 'id.secret+value')).toBe(
      'medicail://reset-password?token=id.secret%2Bvalue',
    );
  });

  it('builds a recovery URL without a token', () => {
    expect(service.buildAppUrl('recovery')).toBe('medicail://recovery');
  });

  it('returns HTML that redirects to the app deeplink when a token is present', () => {
    const html = service.buildBounceHtml('reset-password', 'token-1.secret');

    expect(html).toContain('medicail://reset-password?token=token-1.secret');
    expect(html).toContain('window.location.replace');
    expect(html).toContain('http-equiv="refresh"');
    expect(html).toContain('cliquez ici');
  });

  it('returns a safe page without auto-redirect when the token is missing', () => {
    const html = service.buildBounceHtml('recovery', '  ');

    expect(html).toContain('Lien invalide');
    expect(html).not.toContain('window.location.replace');
    expect(html).not.toContain('http-equiv="refresh"');
    expect(html).toContain('medicail://recovery');
  });

  it('escapes HTML-sensitive characters in the deeplink href', () => {
    mailService.getDeeplinkScheme.mockReturnValue('medicail');
    const html = service.buildBounceHtml('reset-password', 'a"b');

    expect(html).toContain('href="medicail://reset-password?token=a%22b"');
    expect(html).not.toContain('href="medicail://reset-password?token=a"b"');
  });
});
