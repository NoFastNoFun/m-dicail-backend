import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: JwtAuthGuard;

  const createContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new JwtAuthGuard(reflector);
  });

  it('allows access to public routes', () => {
    const context = createContext();
    reflector.getAllAndOverride.mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
  });

  it('delegates to passport guard for protected routes', () => {
    const context = createContext();
    reflector.getAllAndOverride.mockReturnValue(false);
    const parentActivate = jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate').mockReturnValue(of(true));

    guard.canActivate(context);

    expect(parentActivate).toHaveBeenCalledWith(context);
  });
});
