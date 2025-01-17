import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

export class LogInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const dt = Date.now();
    return next.handle().pipe(
      tap(() => {
        console.log(
          `${request.method}: ${request.url} - Execution time: ${Date.now() - dt} ms.`,
        );
      }),
    );
  }
}
