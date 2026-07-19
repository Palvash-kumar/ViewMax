import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as any;
        message = res.message || message;
        errors = res.errors || null;

        // Handle class-validator errors
        if (Array.isArray(res.message)) {
          errors = res.message;
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof Error) {
      // FIX #13: Don't leak internal error messages (stack traces, DB errors, paths)
      // to the client in production. Always log the real error server-side.
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
      if (process.env.NODE_ENV === 'development') {
        message = exception.message;
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
