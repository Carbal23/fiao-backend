import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const body = req.body as { identifier?: unknown } | undefined;
    const identifier =
      typeof body?.identifier === 'string'
        ? body.identifier.trim().toLowerCase()
        : '';
    const ip = req.ip as string | undefined;

    return Promise.resolve(`${ip ?? 'unknown'}:${identifier}`);
  }
}
