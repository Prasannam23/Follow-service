export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const ErrorCodes = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  SELF_FOLLOW: 'SELF_FOLLOW',
  DUPLICATE_FOLLOW: 'DUPLICATE_FOLLOW',
  FOLLOW_NOT_FOUND: 'FOLLOW_NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export const createError = (
  statusCode: number,
  message: string,
  code: string
): AppError => {
  return new AppError(statusCode, message, code);
};
