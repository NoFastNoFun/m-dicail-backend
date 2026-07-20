import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: RolesGuard;

  const createContext = (user?: { id: string; email: string; role: UserRole }): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });

  it('allows access when user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.PRATICIEN]);

    expect(
      guard.canActivate(
        createContext({
          id: 'user-1',
          email: 'a@b.com',
          role: UserRole.PRATICIEN,
        }),
      ),
    ).toBe(true);
  });

  it('throws ForbiddenException when user is missing', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.PRATICIEN]);

    expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user role is insufficient', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.PRATICIEN]);

    expect(() =>
      guard.canActivate(
        createContext({
          id: 'user-1',
          email: 'a@b.com',
          role: UserRole.PATIENT,
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
