import { Request, Response, NextFunction } from 'express';

export const loggingMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const originalSend = _res.send;

  _res.send = function (data: any) {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${_res.statusCode} - ${duration}ms`
    );
    return originalSend.call(this, data);
  };

  next();
};
