/**
 * Contextual data associated with an error.
 *
 * The `public` context is included in the JSON representation returned by
 * {@link BaseError.toJSON}.
 *
 * The `internal` context remains available directly on the error instance but
 * is omitted from the JSON representation returned by {@link BaseError.toJSON}.
 */
export type ErrorContext = {
  /**
   * Contextual data intended to be included in the error's JSON representation.
   */
  public?: Record<string, unknown>;

  /**
   * Contextual data that is omitted from the error's JSON representation.
   *
   * This data remains directly accessible through the error instance.
   * Its omission from JSON serialization does not provide any security or
   * confidentiality guarantees.
   */
  internal?: Record<string, unknown>;
};

/**
 * Options used to construct a {@link BaseError}.
 *
 * @typeParam Code - String literal type representing the error code.
 * @typeParam Message - String literal type representing the error message.
 * @typeParam Context - Type of contextual data associated with the error.
 */
export type BaseErrorOptions<
  Code extends string = string,
  Message extends string = string,
  Context extends ErrorContext = ErrorContext,
> = {
  /**
   * The underlying error or value that caused this error.
   */
  cause?: unknown;

  /**
   * A stable, application-defined identifier for the error.
   */
  readonly code: Code;

  /**
   * Contextual data associated with an error.
   *
   * The `public` context is included in the JSON representation returned by
   * {@link BaseError.toJSON}.
   *
   * The `internal` context remains available directly on the error instance but
   * is omitted from the JSON representation returned by {@link BaseError.toJSON}.
   */
  context?: Context;

  /**
   * A human-readable description of the error.
   */
  readonly message?: Message;
};

/**
 * Options used to construct a {@link BaseError} without specifying an error code.
 *
 * @typeParam Message - String literal type representing the error message.
 * @typeParam Context - Type of contextual data associated with the error.
 */
export type BaseErrorOptionsWithoutCode<
  Message extends string = string,
  Context extends ErrorContext = ErrorContext,
> = Omit<BaseErrorOptions<string, Message, Context>, "code">;

/**
 * Options accepted by {@link BaseError} and {@link createError}.
 *
 * This is a partial view of {@link BaseErrorOptions}, allowing callers to
 * provide only the properties they want to configure or override.
 */
export type ErrorOptions = Partial<BaseErrorOptions>;
