import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Only log write operations
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const user = request.user;

    return next.handle().pipe(
      tap(() => {
        if (user) {
          void this.auditService.log(
            user._id?.toString() || 'unknown',
            `${method} ${url}`,
            this.extractResource(url),
            {
              method,
              url,
              ip: request.ip,
              userAgent: request.get('user-agent'),
            },
          );
        }
      }),
    );
  }

  private extractResource(url: string): string {
    const parts = url.split('/').filter(Boolean);
    // api/resource/id -> resource
    return parts[1] || 'unknown';
  }
}
