import type { Exact, IsObject, Simplify, SimplifyDeep, Merge } from "@opinionated-ts/primitives";

import type { BaseError } from "@/base-error/base";
import type { ErrorContext, ErrorOptions } from "@/base-error/types";

/**
 * Determines whether the resolved error has a context property.
 *
 * This is kept separate from `ResolvedContext` because `BaseError.context` is
 * optional by design. A generated factory, however, can guarantee that context
 * exists when it is configured through `defaults`, `fixed`, or per-error
 * options. This flag allows `ErrorInstance` to reflect that guarantee without
 * making context mandatory for every error.
 *
 * @typeParam Defaults - Default values configured on the factory.
 * @typeParam Options - Values provided for the individual error.
 * @typeParam Fixed - Values controlled by the factory.
 */
type HasContext<
  Defaults extends ErrorOptions,
  Options extends ErrorOptions,
  Fixed extends ErrorOptions,
> = "context" extends keyof Defaults | keyof Options | keyof Fixed ? true : false;

/**
 * Represents the concrete error instance produced by an error factory.
 *
 * `BaseError` already provides the runtime error shape, but its `context`
 * property is always optional. The generated factory can know more precisely
 * whether context is guaranteed to exist, so this type removes that property
 * and adds it back with the correct optionality.
 *
 * The intersection also preserves the configured factory name as a string
 * literal instead of falling back to the generic `Error.name` type.
 *
 * @typeParam Name - Literal name configured for the factory.
 * @typeParam Code - Resolved literal error code.
 * @typeParam Message - Resolved literal error message.
 * @typeParam Context - Fully resolved context type.
 * @typeParam ContextRequired - Whether the factory guarantees that context exists.
 */
type ErrorInstance<
  Name extends string,
  Code extends string,
  Message extends string,
  Context extends ErrorContext,
  ContextRequired extends boolean,
> = Omit<BaseError<Code, Message, Context>, "context"> & {
  readonly name: Name;
} & (ContextRequired extends true
    ? {
        readonly context: Context;
      }
    : {
        readonly context?: Context;
      });

/**
 * Represents the options that remain configurable when creating an error.
 *
 * Properties controlled by `fixed` are removed from the caller's options,
 * including nested properties. Properties that are not fixed remain available.
 *
 * `Simplify` is used only to materialize the resulting intersection into a
 * readable object shape, improving editor hovers without changing its meaning.
 *
 * @typeParam Fixed - Values controlled by the factory and therefore unavailable
 *   to callers.
 */
export type RemainingErrorOptions<Fixed extends ErrorOptions> = Simplify<
  Omit<ErrorOptions, keyof Fixed> & {
    [
      Key in keyof Fixed & keyof ErrorOptions as IsObject<Fixed[Key]> extends true ? Key : never
    ]?: RemoveFixed<ErrorOptions[Key], Fixed[Key]>;
  }
>;

/**
 * Resolves the final error code according to factory precedence.
 *
 * The order is:
 *
 * `fixed` → per-error options → `defaults`
 *
 * `fixed` therefore wins whenever it provides a code. If no level provides a
 * code, the result is `never`, which is used by the factory's call signature to
 * determine whether the caller must provide one.
 *
 * @typeParam Defaults - Default values configured on the factory.
 * @typeParam Options - Values provided for the individual error.
 * @typeParam Fixed - Values controlled by the factory.
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
 * Resolves the final error message according to factory precedence.
 *
 * The order is:
 *
 * `fixed` → per-error options → `defaults`
 *
 * Unlike `code`, a message is not required by the factory. When no configured
 * or per-error literal message is available, the result therefore falls back
 * to `string`.
 *
 * @typeParam Defaults - Default values configured on the factory.
 * @typeParam Options - Values provided for the individual error.
 * @typeParam Fixed - Values controlled by the factory.
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
 * Extracts the concrete context shape from an error-options type.
 *
 * `ErrorOptions` uses the broad `ErrorContext` type, which would otherwise
 * introduce optional `public` and `internal` properties into inference.
 * Checking for `context` first and returning `{}` when it is absent prevents
 * that broad constraint from leaking into the resolved factory context.
 *
 * `NonNullable` removes `undefined` from an explicitly optional context so the
 * merge operation works with the actual context shape rather than
 * `Context | undefined`.
 *
 * @typeParam T - Error options type from which to extract the context.
 */
type ContextOf<T extends ErrorOptions> = "context" extends keyof T ? NonNullable<T["context"]> : {};

/**
 * Represents the fully resolved context stored on a generated error.
 *
 * Context from `defaults`, per-error options, and `fixed` is merged recursively
 * in that order, so later sources override earlier values while preserving
 * properties introduced by previous sources.
 *
 * `SimplifyDeep` materializes the final structure so editor hovers show the
 * concrete merged object instead of a chain of conditional and intersection
 * types.
 *
 * The final constraint ensures the inferred result remains compatible with
 * `ErrorContext`.
 *
 * @typeParam Defaults - Default context configured on the factory.
 * @typeParam Options - Context provided for the individual error.
 * @typeParam Fixed - Context controlled by the factory.
 */
export type ResolvedContext<
  Defaults extends ErrorOptions,
  Options extends ErrorOptions,
  Fixed extends ErrorOptions,
> =
  SimplifyDeep<
    Merge<Merge<ContextOf<Defaults>, ContextOf<Options>>, ContextOf<Fixed>>
  > extends infer Context extends ErrorContext
    ? Context
    : ErrorContext;

/**
 * Represents the options accepted by a generated factory for one error.
 *
 * It starts from `RemainingErrorOptions` so factory-fixed properties cannot be
 * overridden. When neither `fixed` nor `defaults` provides a `code`, the
 * additional branch makes `code` mandatory for the individual error.
 *
 * This type deliberately does not use per-error values for resolution; its
 * purpose is only to describe what the caller is allowed or required to pass.
 *
 * @typeParam Defaults - Default values configured on the factory.
 * @typeParam Fixed - Values controlled by the factory.
 */
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
 * Represents the primary call signature of an error factory.
 *
 * `Options` is a `const` type parameter so literal values supplied for a
 * specific error are preserved exactly and can flow into the resulting
 * `ErrorInstance`.
 *
 * `Exact` rejects additional properties while the intersection with
 * `FactoryErrorOptions` provides the contextual type used by TypeScript for
 * editor autocomplete. Both are intentional: `Exact` enforces the public API,
 * while the contextual type keeps `Ctrl + Space` useful without sacrificing
 * literal inference.
 *
 * @typeParam Name - Literal name configured for the factory.
 * @typeParam Defaults - Default values configured on the factory.
 * @typeParam Fixed - Values controlled by the factory.
 */
type FactoryErrorCall<
  Name extends string,
  Defaults extends ErrorOptions,
  Fixed extends ErrorOptions,
> = <const Options extends FactoryErrorOptions<Defaults, Fixed>>(
  error: Exact<Options, FactoryErrorOptions<Defaults, Fixed>> &
    FactoryErrorOptions<Defaults, Fixed>,
) => ErrorInstance<
  Name,
  ErrorCode<Defaults, Options, Fixed>,
  ErrorMessage<Defaults, Options, Fixed>,
  ResolvedContext<Defaults, Options, Fixed>,
  HasContext<Defaults, Options, Fixed>
>;

/**
 * Represents the zero-argument call signature of an error factory.
 *
 * A factory can be called without arguments when either `fixed.code` or
 * `defaults.code` already provides the required error code. When neither does,
 * this signature becomes `unknown`, so the factory cannot be called without
 * providing the required options.
 *
 * The zero-argument signature is kept separate from `FactoryErrorCall` because
 * a required parameter cannot simultaneously model both `factory()` and
 * `factory(options)` cleanly.
 *
 * @typeParam Name - Literal name configured for the factory.
 * @typeParam Defaults - Default values configured on the factory.
 * @typeParam Fixed - Values controlled by the factory.
 */
type OptionalFactoryCall<
  Name extends string,
  Defaults extends ErrorOptions,
  Fixed extends ErrorOptions,
> = Fixed extends { code: string }
  ? () => ErrorInstance<
      Name,
      ErrorCode<Defaults, {}, Fixed>,
      ErrorMessage<Defaults, {}, Fixed>,
      ResolvedContext<Defaults, {}, Fixed>,
      HasContext<Defaults, {}, Fixed>
    >
  : Defaults extends { code: string }
    ? () => ErrorInstance<
        Name,
        ErrorCode<Defaults, {}, Fixed>,
        ErrorMessage<Defaults, {}, Fixed>,
        ResolvedContext<Defaults, {}, Fixed>,
        HasContext<Defaults, {}, Fixed>
      >
    : unknown;

/**
 * Callable error factory returned by {@link createError}.
 *
 * The factory supports both:
 *
 * - `factory()` when enough configuration is already available.
 * - `factory(options)` when per-error values are needed or required.
 *
 * The resulting instance preserves literal inference for its name, code,
 * message, and resolved context.
 *
 * @typeParam Name - Literal name configured for the factory.
 * @typeParam Defaults - Default values configured on the factory.
 * @typeParam Fixed - Values controlled by the factory.
 */
export type ErrorFactory<
  Name extends string,
  Defaults extends ErrorOptions,
  Fixed extends ErrorOptions,
> = FactoryErrorCall<Name, Defaults, Fixed> & OptionalFactoryCall<Name, Defaults, Fixed>;

/**
 * Configuration used to create a specialized error factory.
 *
 * A factory can define:
 *
 * - `name` — the name assigned to the factory and its errors.
 * - `defaults` — values automatically used when an error does not provide them.
 * - `fixed` — values controlled by the factory and always used as configured.
 *
 * `Exact` is intentionally part of `defaults` and `fixed` so the supplied
 * configuration receives contextual typing for autocomplete while preserving
 * the exact literals captured by the generic parameters.
 *
 * Fixed values cannot be overridden when creating an error.
 *
 * @typeParam Name - Literal name assigned to the factory.
 * @typeParam Defaults - Exact default values configured on the factory.
 * @typeParam Fixed - Exact values controlled by the factory.
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
   *
   * The `Exact` constraint provides contextual typing for editor autocomplete
   * while preserving the concrete inferred values for later type resolution.
   */
  defaults?: Exact<Defaults, ErrorOptions> & ErrorOptions;

  /**
   * Values controlled by the factory.
   *
   * These values always take precedence over defaults and per-error options
   * and cannot be overridden by callers.
   *
   * The `Exact` constraint provides contextual typing for editor autocomplete
   * while preserving the concrete inferred values for later type resolution.
   */
  fixed?: Exact<Fixed, ErrorOptions> & ErrorOptions;
};

/**
 * Removes properties from `Source` that are controlled by `Fixed`.
 *
 * When `Fixed` is an object, properties existing at both levels are traversed
 * recursively. Properties fixed at a leaf are therefore no longer available
 * as caller-configurable values, while non-fixed descendants remain available.
 *
 * This is what allows a factory to fix a nested value such as
 * `context.internal.source` without preventing callers from adding unrelated
 * values such as `context.internal.requestId` or `context.public`.
 *
 * Arrays are treated as leaf values and are returned unchanged because their
 * elements are not independently configurable object properties.
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
