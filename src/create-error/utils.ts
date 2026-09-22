import { merge, type Merge } from "@opinionated-ts/primitives";

import type { ErrorOptions } from "@/base-error/types";

/**
 * Removes `undefined` from a type while preserving an empty object when the
 * type contains no defined value.
 *
 * This is used to normalize optional merge sources so that an absent source
 * does not propagate `undefined` or `never` into the resulting merged type.
 *
 * @typeParam T - Type from which `undefined` should be removed.
 */
type Defined<T> = [Exclude<T, undefined>] extends [never] ? {} : Exclude<T, undefined>;

/**
 * Removes `readonly` modifiers from the properties of an object type.
 *
 * This is used when constructing merged results that must be incrementally
 * populated before being returned as a readonly-compatible type.
 *
 * @typeParam T - Object type whose property modifiers should be made mutable.
 */
type Mutable<T> = {
  -readonly [Key in keyof T]: T[Key];
};

/**
 * Resolves the final error options by recursively merging factory defaults,
 * caller-provided options, and factory-fixed values.
 *
 * Sources are applied in order:
 *
 * `defaults` → `options` → `fixed`
 *
 * Later sources take precedence over earlier sources. `undefined` sources are
 * ignored while preserving the exact inferred types of the provided options.
 *
 * @typeParam Defaults - Default values configured for the factory.
 * @typeParam Options - Values supplied when creating a specific error.
 * @typeParam Fixed - Values controlled by the factory.
 */
type MergeErrorOptions<
  Defaults extends ErrorOptions | undefined,
  Options extends ErrorOptions,
  Fixed extends ErrorOptions | undefined,
> = Merge<Merge<Defined<Defaults>, Options>, Defined<Fixed>>;

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
export function mergeErrorOptions<
  const Defaults extends ErrorOptions | undefined,
  const Options extends ErrorOptions,
  const Fixed extends ErrorOptions | undefined,
>(defaults: Defaults, error: Options, fixed: Fixed): MergeErrorOptions<Defaults, Options, Fixed> {
  const cause = fixed?.cause ?? error.cause ?? defaults?.cause;
  const code = fixed?.code ?? error.code ?? defaults?.code;
  const message = fixed?.message ?? error.message ?? defaults?.message;

  const internalContext = merge(
    defaults?.context?.internal,
    error.context?.internal,
    fixed?.context?.internal,
  );

  const publicContext = merge(
    defaults?.context?.public,
    error.context?.public,
    fixed?.context?.public,
  );

  const result: Mutable<ErrorOptions> = {};

  if (cause !== undefined) result.cause = cause;
  if (code !== undefined) result.code = code;
  if (message !== undefined) result.message = message;

  if (internalContext !== undefined || publicContext !== undefined) {
    result.context = {};

    if (internalContext !== undefined) {
      result.context.internal = internalContext;
    }

    if (publicContext !== undefined) {
      result.context.public = publicContext;
    }
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return result as MergeErrorOptions<Defaults, Options, Fixed>;
}
