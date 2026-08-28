import { resolveCorsOrigins, shouldEnableSwagger } from './bootstrap.util';

describe('bootstrap.util', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('resolveCorsOrigins prefers CORS_ORIGINS', () => {
    process.env.CORS_ORIGINS = 'https://a.test, https://b.test';
    process.env.APP_PUBLIC_URL = 'https://ignored.test';
    expect(resolveCorsOrigins()).toEqual(['https://a.test', 'https://b.test']);
  });

  it('resolveCorsOrigins falls back to APP_PUBLIC_URL', () => {
    delete process.env.CORS_ORIGINS;
    process.env.APP_PUBLIC_URL = 'https://app.test';
    expect(resolveCorsOrigins()).toEqual(['https://app.test']);
  });

  it('shouldEnableSwagger is off in production unless forced', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_SWAGGER;
    expect(shouldEnableSwagger()).toBe(false);

    process.env.ENABLE_SWAGGER = 'true';
    expect(shouldEnableSwagger()).toBe(true);
  });
});
