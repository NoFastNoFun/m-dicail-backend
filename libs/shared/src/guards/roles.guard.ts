import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@features/users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface RequestUser {
  role: UserRole;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user: RequestUser }>();
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Rôle insuffisant pour cette action');
    }
    return true;
  }
}
