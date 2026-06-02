import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class MongoSanitizeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body) {
      this.sanitizeInPlace(req.body);
    }
    if (req.query) {
      this.sanitizeInPlace(req.query);
    }
    if (req.params) {
      this.sanitizeInPlace(req.params);
    }
    next();
  }

  private sanitizeInPlace(obj: any): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === 'object' && obj[i] !== null) {
          this.sanitizeInPlace(obj[i]);
        }
      }
      return;
    }

    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.sanitizeInPlace(obj[key]);
      }
    }
  }
}
