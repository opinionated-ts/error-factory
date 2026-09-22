import type { Exact, IsObject, Simplify, SimplifyDeep, Merge } from "@opinionated-ts/primitives";

import type { BaseError } from "@/base-error/base";
import type { ErrorContext, ErrorOptions } from "@/base-error/types";

/**
 * Represents an error created by a factory returned from {@link createError}.
 *
 * The resulting error contains the factory's configured name together with the
 * final code, message, and context resolved for that specific error.
 */
type ErrorInstance<
  Name extends string,
  Code extends string,
  Message extends string,
  Context extends ErrorContext,
> = Omit<BaseError<Code, Message, Context>, "context"> & {
  readonly name: Name;
  readonly context: Context;
};

/**
 * Represents the options accepted by a generated error factory.
 *
 * Values controlled by the factory are removed from the caller's options.
 * Nested objects remain available when they contain properties that are still
 * allowed to be provided by the caller.
 */
export type RemainingErrorOptions<Fixed extends ErrorOptions> = Simplify<
  Omit<ErrorOptions, keyof Fixed> & {
    [
      Key in keyof Fixed & keyof ErrorOptions as IsObject<Fixed[Key]> extends true ? Key : never
    ]?: RemoveFixed<ErrorOptions[Key], Fixed[Key]>;
  }
>;

/**
 * Resolves the error code used by the generated factory.
 *
 * Factory-fixed values take precedence over values supplied when creating the
 * error, which in turn take precedence over factory defaults.
 */
type ErrorCode<
  Defaults extends ErrorOptions,
  Options extends ErrorOptions,
  Fixed extends ErrorOptions,
> = Fixed extends { code: infer Code extends string }
  ? Code
  : Options extends { code: infer Code extends string }
    ? Code
    : Defaults extends { code: infer Code extends string }
      ? Code
      : never;

/**
 * Resolves the error message used by the generated factory.
 *
 * Factory-fixed values take precedence over values supplied when creating the
 * error, which in turn take precedence over factory defaults.
 */
type ErrorMessage<
  Defaults extends ErrorOptions,
  Options extends ErrorOptions,
  Fixed extends ErrorOptions,
> = Fixed extends { message: infer Message extends string }
  ? Message
  : Options extends { message: infer Message extends string }
    ? Message
    : Defaults extends { message: infer Message extends string }
      ? Message
      : string;

/**
 * Represents the final context stored on the created error.
 *
 * Default context, per-error context, and fixed context are combined
 * recursively, with fixed values taking precedence.
 */
export type ResolvedContext<
  Defaults extends ErrorOptions,
  Options extends ErrorOptions,
  Fixed extends ErrorOptions,
> = SimplifyDeep<
  Extract<Merge<Merge<Defaults["context"], Options["context"]>, Fixed["context"]>, ErrorContext>
>;

type FactoryErrorOptions<
  Defaults extends ErrorOptions,
  Fixed extends ErrorOptions,
> = RemainingErrorOptions<Fixed> &
  (Fixed extends { code: string }
    ? unknown
    : Defaults extends { code: string }
      ? unknown
      : {
          code: string;
        });

/**
 * Callable error factory returned by {@link createError}.
 *
 * Pass the options that should vary for the specific error being created.
 * Values configured as defaults are used automatically, while fixed values
 * always remain under the factory's control.
 */
export type ErrorFactory<
  Name extends string,
  Defaults extends ErrorOptions,
  Fixed extends ErrorOptions,
> = <const Options extends FactoryErrorOptions<Defaults, Fixed>>(
  error: Exact<Options, FactoryErrorOptions<Defaults, Fixed>>,
) => ErrorInstance<
  Name,
  ErrorCode<Defaults, Options, Fixed>,
  ErrorMessage<Defaults, Options, Fixed>,
  ResolvedContext<Defaults, Options, Fixed>
>;

/**
 * Configuration used to create a specialized error factory.
 *
 * A factory can define:
 *
 * - `name` — the name assigned to the factory and its errors.
 * - `defaults` — values automatically used when an error does not provide
 *   them.
 * - `fixed` — values controlled by the factory and always used as configured.
 *
 * Fixed values cannot be overridden when creating an error.
 */
export type CreateErrorOptions<
  Name extends string,
  Defaults extends ErrorOptions,
  Fixed extends ErrorOptions,
> = {
  /** Name assigned to the factory and the errors it creates. */
  name?: Name;

  /**
   * Values used automatically when the corresponding value is not provided
   * when creating an error.
   */
  defaults?: Defaults;

  /**
   * Values controlled by the factory.
   *
   * These values always take precedence over defaults and per-error options
   * and cannot be overridden by callers.
   */
  fixed?: Fixed;
};

/**
 * Removes properties from `Source` that are controlled by `Fixed`.
 *
 * When `Fixed` is an object, properties existing at both levels are traversed
 * recursively. Properties fixed at a leaf are therefore no longer available
 * as caller-configurable values, while non-fixed descendants remain available.
 *
 * Arrays are treated as leaf values and are returned unchanged.
 *
 * @typeParam Source - Source options from which fixed properties are removed.
 * @typeParam Fixed - Values that are controlled by the factory.
 *
 * @example
 * ```ts
 * type Source = {
 *   context?: {
 *     internal?: {
 *       source?: string;
 *       requestId?: string;
 *     };
 *   };
 * };
 *
 * type Fixed = {
 *   context: {
 *     internal: {
 *       source: "api";
 *     };
 *   };
 * };
 *
 * type Result = RemoveFixed<Source, Fixed>;
 *
 * // {
 * //   context?: {
 * //     internal?: {
 * //       source?: never;
 * //       requestId?: string;
 * //     };
 * //   };
 * // }
 * ```
 */
export type RemoveFixed<Source, Fixed> =
  IsObject<Fixed> extends true
    ? Source extends readonly unknown[]
      ? Source
      : Source extends object
        ? Omit<Source, keyof Fixed> &
            Partial<{
              [Key in keyof Fixed & keyof Source]: RemoveFixed<
                NonNullable<Source[Key]>,
                Fixed[Key]
              >;
            }>
        : Source
    : never;
