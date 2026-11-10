export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function notFound(resource: string): HttpError {
  return new HttpError(404, "not_found", `${resource} was not found`);
}

export function conflict(message: string): HttpError {
  return new HttpError(409, "conflict", message);
}
