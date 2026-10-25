import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return user && requiredRoles.includes(user.role);
  }
}

export const Roles = (...roles: string[]): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('roles', roles, target, propertyKey);
    return descriptor;
  };
};