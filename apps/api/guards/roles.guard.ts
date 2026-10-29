import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Singleton Reflector instance.
 *
 * NestJS's InternalCoreModule (which provides Reflector) is NOT registered
 * when building a TestingModule with Test.createTestingModule — the
 * TestingModuleBuilder does not call registerCoreModule(). This means any
 * provider that depends on Reflector (e.g. RolesGuard) gets `undefined`
 * injected, because the token cannot be resolved in the test module tree.
 *
 * We work around this by lazily creating our own Reflector instance on
 * first use. Reflector is a stateless wrapper around the native Reflect
 * API, so this is safe.
 */
const reflector = new Reflector();

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = reflector.getAllAndOverride<string[]>('roles', [
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