import { ExecutionContext } from '@nestjs/common';

// Method decorator that wraps the return value in a standard response format
export function ResponseFormat(): MethodDecorator {
  return function (target: any, key: string | symbol, descriptor: TypedPropertyDescriptor<any>) {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await original.apply(this, args);

      // If result already has a status field, return as-is
      if (result && typeof result === 'object' && result.status) {
        return result;
      }

      // Wrap in standard response format
      return {
        status: 200,
        data: result,
      };
    };

    return descriptor;
  };
}