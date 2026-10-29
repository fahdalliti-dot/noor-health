import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { PrismaService } from '../db/prisma.service';

/**
 * Interceptor that wraps the request handler in a Prisma transaction
 * to ensure the RLS session variable (app.clinic_id) persists for all
 * queries within the request. Uses is_local=true so the setting is
 * automatically cleared when the transaction commits/rolls back.
 */
@Injectable()
export class ClinicContextInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {
    console.log('[ClinicContextInterceptor] constructor, prisma:', !!this.prisma, 'has $transaction:', typeof this.prisma?.$transaction);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user or no clinic_id, proceed without RLS context
    // (RLS will block all reads for saas_app role)
    if (!user || !user.clinic_id) {
      return next.handle();
    }

    const clinicId = user.clinic_id;

    // Wrap the request handler in a Prisma transaction
    // This ensures all queries run on the same pooled connection
    return from(this.prisma.$transaction(async (tx) => {
      // Set the RLS session variable for this transaction
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.clinic_id', $1, true)`,
        clinicId
      );

      // Execute the route handler within this transaction
      return new Promise((resolve, reject) => {
        next.handle().subscribe({
          next: (value) => resolve(value),
          error: (err) => reject(err),
        });
      });
    })).pipe(
      catchError((err) => throwError(() => err))
    );
  }
}