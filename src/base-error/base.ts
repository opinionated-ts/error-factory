import type { BaseErrorOptions, ErrorContext } from "./types";

/**
 * Base class for application-specific errors.
 *
 * Provides a stable error code, typed message, contextual data, the original
 * cause, and the creation timestamp while preserving the standard {@link Error} API.
 *
 * When converted to JSON through {@link BaseError.toJSON}, only the `public`
 * portion of the context is included. The `internal` portion remains directly
 * accessible on the error instance but is omitted from the JSON representation.
 *
 * @example
 * ```ts
 * const error = new BaseError({
 *   code: "INVALID_INPUT",
 *   message: "The provided input is invalid.",
 *   context: {
 *     public: {
 *       field: "email",
 *     },
 *     internal: {
 *       requestId: "req_123",
 *       databaseQuery: "SELECT ...",
 *     },
 *   },
 * });
 *
 * error.context?.internal?.requestId;
 * // "req_123"
 *
 * JSON.stringify(error);
 * // {
 * //   "code": "INVALID_INPUT",
 * //   "context": {
 * //     "field": "email"
 * //   },
 * //   "message": "The provided input is invalid.",
 * //   "createdAt": "..."
 * // }
 * ```
 */
export class BaseError<
  Code extends string = string,
  Message extends string = string,
  Context extends ErrorContext = ErrorContext,
> extends Error {
  /**
   * A stable, application-defined identifier for the error.
   */
  public readonly code: Code;

  /**
   * A human-readable description of the error.
   */
  declare public readonly message: Message;

  /**
   * Additional contextual data associated with the error.
   *
   * The `public` portion is included in the JSON representation, while the
   * `internal` portion remains directly accessible on the error instance and
   * is omitted from JSON.
   */
  public readonly context?: Context;

  /**
   * The date and time when the error was created, represented as an ISO 8601
   * string in UTC.
   */
  public readonly createdAt: string;

  /**
   * Creates a new {@link BaseError}.
   *
   * @param properties - Options used to initialize the error.
   */
  constructor(properties: BaseErrorOptions<Code, Message, Context>) {
    super(
      properties.message,
      properties.cause === undefined ? undefined : { cause: properties.cause },
    );

    this.name = new.target.name;
    this.code = properties.code;

    if (properties.context !== undefined) {
      this.context = properties.context;
    }

    this.createdAt = new Date().toISOString();
  }

  /**
   * Returns the JSON representation of the error.
   *
   * The `public` context is included when present. The `internal` context is
   * omitted from the returned object, although it remains directly accessible
   * through the error instance.
   */
  public toJSON() {
    return {
      code: this.code,
      message: this.message,
      context: this.context?.public,
      createdAt: this.createdAt,
    };
  }
}

export type { BaseErrorOptions, BaseErrorOptionsWithoutCode, ErrorContext } from "./types";
