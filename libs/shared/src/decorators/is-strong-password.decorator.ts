import { registerDecorator, ValidationOptions } from 'class-validator';

export const STRONG_PASSWORD_SPECIAL_CHARACTERS = '!@#$%^&*(),.?":{}|<>_-';

const STRONG_PASSWORD_REGEX = new RegExp(`^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[${STRONG_PASSWORD_SPECIAL_CHARACTERS}]).{8,}$`);

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && STRONG_PASSWORD_REGEX.test(value);
        },
        defaultMessage(): string {
          return 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial';
        },
      },
    });
  };
}
