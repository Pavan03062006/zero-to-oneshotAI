export type ErrorCode =
  | "UNAUTHENTICATED"
  | "PROJECT_ACCESS_DENIED"
  | "INSUFFICIENT_ROLE"
  | "RESOURCE_NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "AI_PROVIDER_FAILED"
  | "AI_RESPONSE_INVALID"
  | "PERSISTENCE_FAILED"
  | "CONFLICT"
  | "INTERNAL_ERROR";
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status = 400,
    public details?: unknown,
  ) {
    super(message);
  }
}
export function errorResponse(error: unknown, requestId: string, headers: HeadersInit) {
  const e =
    error instanceof AppError
      ? error
      : new AppError("INTERNAL_ERROR", "The request could not be completed.", 500);
  if (!(error instanceof AppError))
    console.error(
      JSON.stringify({ requestId, error: error instanceof Error ? error.message : String(error) }),
    );
  return new Response(
    JSON.stringify({
      error: {
        code: e.code,
        message: e.message,
        requestId,
        details: e.code === "VALIDATION_FAILED" ? e.details : undefined,
      },
    }),
    { status: e.status, headers: { ...headers, "Content-Type": "application/json" } },
  );
}
