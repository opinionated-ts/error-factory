import type { ErrorOptions } from "@/base-error/types";

import { BaseError } from "@/base-error/base";
import { captureStackTrace } from "@/utils/stack-trace";

import type { CreateErrorOptions, ErrorFactory } from "./types";

import { mergeErrorOptions } from "./utils";

/**
 * Creates a reusable factory for a specific kind of error.
 *
 * Use the factory configuration to define values that are shared across all
 * errors, and provide per-error values when creating individual errors.
 *
 * When the same option is provided at multiple levels, the most specific
 * value takes precedence:
 *
 * `fixed` > per-error options > `defaults`
 *
 * - `defaults` provide values used when no other value is provided.
 * - Per-error options customize a specific error and take precedence over
 *   `defaults`.
 * - `fixed` values are controlled by the factory, take precedence over other
 *   values, and cannot be overridden by individual errors.
 *
 * This makes it possible to define a common error configuration once while
 * still allowing each created error to provide its own details where needed.
 *
 * If no `code` is provided by `defaults` or `fixed`, each created error must
 * provide its own `code`.
 *
 * @param options - Configuration for the values shared by the factory.
 * @returns A factory for creating errors with the configured defaults and
 *   fixed values.
 *
 * @example
 * ```ts
 * const ApiError = createError({
 *   name: "ApiError",
 *   defaults: {
 *     message: "An API error occurred",
 *     context: {
 *       internal: {
 *         requestPath: "/",
 *       },
 *     },
 *   },
 *   fixed: {
 *     code: "API_ERROR",
 *     context: {
 *       internal: {
 *         source: "api",
 *       },
 *     },
 *   },
 * });
 *
 * throw ApiError({
 *   message: "Request failed", // takes precedence over defaults.message
 *   context: {
 *     internal: {
 *       requestPath: "/other-path", // takes precedence over defaults.context.internal.requestPath
 *     },
 *   },
 * });
 * ```
 */
export function createError<
  const Name extends string = "Error",
  const Defaults extends ErrorOptions = {},
  const Fixed extends ErrorOptions = {},
>(options: CreateErrorOptions<Name, Defaults, Fixed>): ErrorFactory<Name, Defaults, Fixed>;
export function createError<
  const Name extends string = "Error",
  const Defaults extends ErrorOptions = {},
  const Fixed extends ErrorOptions = {},
>(options: CreateErrorOptions<Name, Defaults, Fixed>): ErrorFactory<Name, Defaults, Fixed> {
  const name = options.name ?? "Error";

  /**
   * Concrete error class used internally by the generated factory.
   *
   * The class applies factory defaults, caller options, and fixed values before
   * delegating the final initialization to {@link BaseError}.
   */
  const GeneratedError = class extends BaseError {
    /**
     * Creates an error instance using the configured error options.
     *
     * @param error - Error options supplied by the generated factory.
     * @throws {Error} When no error code is available after option resolution.
     */
    constructor(error: ErrorOptions) {
      const merged = mergeErrorOptions(options.defaults, error, options.fixed);

      if (merged.code === undefined) {
        throw new Error("An error code is required");
      }

      // oxlint-disable-next-line typescript/no-unsafe-type-assertion - The `merged` object is explicitly typed as an `ErrorOptions` with a guaranteed `code` property.
      super(merged as ErrorOptions & { code: string });
    }
  };

  Object.defineProperty(GeneratedError, "name", {
    value: name,
    configurable: true,
  });

  /**
   * Creates an instance of the generated error class.
   *
   * @param error - Error options resolved using the factory configuration.
   * @returns A configured error instance.
   */
  function create(error: ErrorOptions) {
    const instance = new GeneratedError(error);

    captureStackTrace(instance, create);

    return instance;
  }

  Object.defineProperty(create, "name", {
    value: name,
    configurable: true,
  });

  create.prototype = GeneratedError.prototype;

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion - The `create` function is explicitly typed as an `ErrorFactory` with the provided type parameters.
  return create as ErrorFactory<Name, Defaults, Fixed>;
}
