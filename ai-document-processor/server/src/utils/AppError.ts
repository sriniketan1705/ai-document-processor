// Custom error with an HTTP status code, so controllers can just `throw new AppError('msg', 404)`
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
