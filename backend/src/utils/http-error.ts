export type HttpErrorPayload = {
  message: string;
  statusCode: number;
  details?: unknown;
};

export class HttpError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(payload: HttpErrorPayload) {
    super(payload.message);
    this.name = "HttpError";
    this.statusCode = payload.statusCode;
    this.details = payload.details;
  }

  static badRequest(message: string, details?: unknown) {
    return new HttpError({ message, statusCode: 400, details });
  }

  static unauthorized(message: string = "Não autorizado.") {
    return new HttpError({ message, statusCode: 401 });
  }

  static forbidden(message: string = "Acesso negado.") {
    return new HttpError({ message, statusCode: 403 });
  }

  static notFound(message: string) {
    return new HttpError({ message, statusCode: 404 });
  }

  static conflict(message: string, details?: unknown) {
    return new HttpError({ message, statusCode: 409, details });
  }

  static internal(message: string = "Erro interno do servidor.", details?: unknown) {
    return new HttpError({ message, statusCode: 500, details });
  }
}