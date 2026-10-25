import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Catches Prisma database errors and maps them to semantic HTTP responses.
 *
 * - P2002 / exclusion-constraint violation (PostgreSQL error code 23P01)
 *   → 409 Conflict with `code: "slot_unavailable"`.
 *
 * All other DB errors fall back to 500.
 */
@Catch()
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // If it's already an HttpException (thrown by our service layer), use it.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(body);
      return;
    }

    // Inspect Prisma error shapes.
    const prismaError = exception as any;
    const code = prismaError?.code;
    const causeCode = prismaError?.cause?.code;
    const msg = (prismaError?.message || '') as string;

    // 23P01 = exclusion constraint violation (PostgreSQL)
    // P2002 = unique constraint violation (Prisma)
    const isDoubleBooking =
      causeCode === '23P01' ||
      msg.includes('exclusion') ||
      msg.includes('overlapping');

    if (isDoubleBooking) {
      response.status(409).json({
        status: 409,
        data: {
          error: 'Time slot unavailable',
          code: 'slot_unavailable',
        },
      });
      return;
    }

    // Fallback — 500
    console.error('Unhandled DB error:', exception);
    response.status(500).json({
      status: 500,
      data: { error: 'Internal server error' },
    });
  }
}
