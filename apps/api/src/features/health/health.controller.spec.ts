import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns enriched health payload', () => {
    const controller = new HealthController();
    const result = controller.check();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(result.version).toMatch(/\d+\.\d+\.\d+/);
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(result.timestamp).toEqual(expect.any(String));
    expect(result).not.toHaveProperty('node');
    expect(result).not.toHaveProperty('environment');
  });
});
