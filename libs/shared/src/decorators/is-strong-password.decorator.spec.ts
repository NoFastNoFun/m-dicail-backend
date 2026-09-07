import { validate } from 'class-validator';
import { IsStrongPassword } from './is-strong-password.decorator';

class PasswordDto {
  @IsStrongPassword()
  declare password: string;
}

async function validatePassword(password: string): Promise<boolean> {
  const dto = new PasswordDto();
  dto.password = password;
  const errors = await validate(dto);
  return errors.length === 0;
}

describe('IsStrongPassword', () => {
  it('accepts a password with uppercase, lowercase, digit and special character', async () => {
    expect(await validatePassword('Testtest1*')).toBe(true);
  });

  it('accepts a hyphen as a valid special character', async () => {
    expect(await validatePassword('Testtest1-')).toBe(true);
  });

  it('rejects a password shorter than 8 characters', async () => {
    expect(await validatePassword('Tt1*')).toBe(false);
  });

  it('rejects a password without an uppercase letter', async () => {
    expect(await validatePassword('testtest1*')).toBe(false);
  });

  it('rejects a password without a lowercase letter', async () => {
    expect(await validatePassword('TESTTEST1*')).toBe(false);
  });

  it('rejects a password without a digit', async () => {
    expect(await validatePassword('Testtest**')).toBe(false);
  });

  it('rejects a password without a special character', async () => {
    expect(await validatePassword('Testtest1')).toBe(false);
  });

  it('rejects a non-string value', async () => {
    expect(await validatePassword(undefined as unknown as string)).toBe(false);
  });
});
