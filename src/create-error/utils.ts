import { mergeInto } from "@opinionated-ts/primitives";

import type { ErrorContext, ErrorOptions } from "@/base-error/types";

/**
 * Recursively merges error options using factory precedence.
 *
 * The merge order is:
 *
 * `defaults` → caller options → `fixed`
 *
 * Top-level options are shallow-merged. Only `context` is merged recursively,
 * so nested public and internal data can be extended without replacing the
 * entire context object.
 *
 * @param defaults - Default values configured for the factory.
 * @param error - Values supplied when creating a specific error.
 * @param fixed - Values controlled by the factory.
 * @returns The merged error options.
 */
export function mergeErrorOptions(
  defaults: ErrorOptions | undefined,
  error: ErrorOptions,
  fixed: ErrorOptions | undefined,
): ErrorOptions {
  const result: ErrorOptions = {
    ...defaults,
    ...error,
    ...fixed,
  };

  const defaultContext = defaults?.context;
  const errorContext = error.context;
  const fixedContext = fixed?.context;

  if (defaultContext !== undefined || errorContext !== undefined || fixedContext !== undefined) {
    result.context = mergeContext(defaultContext, errorContext, fixedContext);
  }

  return result;
}

/**
 * Recursively merges error contexts from left to right.
 *
 * Later values override earlier values. Nested plain objects are merged, while
 * arrays, class instances, and other leaf values replace the previous value.
 */
function mergeContext(
  defaults: ErrorContext | undefined,
  error: ErrorContext | undefined,
  fixed: ErrorContext | undefined,
): ErrorContext {
  const result: Record<string, unknown> = {};

  if (defaults !== undefined) {
    mergeInto(result, defaults);
  }

  if (error !== undefined) {
    mergeInto(result, error);
  }

  if (fixed !== undefined) {
    mergeInto(result, fixed);
  }

  return result;
}
