import { Request, Response, NextFunction } from 'express';

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function (data: string | object | Buffer) {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
    return originalSend.call(this, data);
  };

  next();
};
