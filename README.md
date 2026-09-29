# @opinionated-ts/error-factory

Type-safe error factories for TypeScript with automatic type inference.

> [!WARNING]
>
> This project is not yet recommended for production use.
>
> The API is established, but further testing and real-world validation are needed before `1.0.0`.

## Why Error Factories?

Creating errors directly with `new Error()` makes it easy for different parts of an application to represent the same kind of failure differently.

`@opinionated-ts/error-factory` provides a reusable factory for each kind of application error.

A factory can define:

- a stable error `code`
- a default `message`
- shared `context`
- fixed values controlled by the factory
- a descriptive `name`

Individual errors can then provide only the values that vary for that specific failure.

The result is a regular `Error` instance with strongly typed properties derived from the factory configuration and the values passed when creating it.

## Quick Start

### Install

```bash
bun add @opinionated-ts/error-factory
# pnpm add @opinionated-ts/error-factory
# yarn add @opinionated-ts/error-factory
# npm install @opinionated-ts/error-factory
```

### Install the Skill

An optional `create-error` skill is available for AI coding agents. It provides guidance for working with `@opinionated-ts/error-factory`, including creating error factories, configuring `defaults` and `fixed` values, and using typed error inference.

See [`skills/`](https://github.com/opinionated-ts/error-factory/tree/main/skills) for installation instructions.

### Create an error factory

```ts
import { createError } from "@opinionated-ts/error-factory";

export const ValidationError = createError({
  name: "ValidationError",
  defaults: {
    message: "Validation failed.",
  },
});
```

Create an error by calling the factory:

```ts
const error = ValidationError({
  code: "INVALID_EMAIL",
  message: "The email address is invalid.",
  context: {
    public: {
      field: "email",
    },
  },
});

throw error;
```

Factories are callable functions, not classes:

```ts
ValidationError({
  code: "INVALID_EMAIL",
});
```

They are also usable with `instanceof`:

```ts
error instanceof ValidationError; // true
```

## Factory Configuration

A factory accepts three configuration areas:

```ts
const ApiError = createError({
  name: "ApiError",

  defaults: {
    message: "An API error occurred.",
    context: {
      internal: {
        requestPath: "/",
      },
    },
  },

  fixed: {
    code: "API_ERROR",
    context: {
      internal: {
        source: "api",
      },
    },
  },
});
```

### `name`

The name assigned to the factory and to the errors it creates.

It defaults to `"Error"` when omitted.

### `defaults`

Values used when a specific error does not provide them.

```ts
const ApiError = createError({
  defaults: {
    message: "An API error occurred.",
  },
});
```

A call can override default values:

```ts
ApiError({
  code: "REQUEST_FAILED",
  message: "The request could not be completed.",
});
```

### `fixed`

Values controlled by the factory.

Fixed values always take precedence and cannot be overridden by callers:

```ts
const ApiError = createError({
  fixed: {
    code: "API_ERROR",
  },
});
```

The resulting factory does not require callers to provide `code`, and attempting to provide a different fixed value is rejected by the type system.

Objects can also be fixed partially. Non-fixed nested properties remain available to callers.

## Value Resolution

When the same value exists at multiple levels, the precedence is:

```text
defaults → per-error options → fixed
```

The most specific value wins:

```text
fixed
  ↓
per-error options
  ↓
defaults
```

Object values are merged recursively, allowing individual errors to extend shared context without replacing it completely.

## Context

Errors can separate consumer-facing information from internal operational information.

```ts
const error = ApiError({
  context: {
    public: {
      field: "email",
    },
    internal: {
      requestId: "req_123",
    },
  },
});
```

### `context.public`

Data intended to be exposed to error consumers.

It is included in `error.toJSON()` and in the representation produced by `JSON.stringify(error)`.

### `context.internal`

Operational data that remains available on the error instance but is omitted from JSON serialization.

```ts
error.context?.internal?.requestId;
```

Omitting `internal` from JSON is **not a security or confidentiality guarantee**. Do not store secrets there.

## Causes

Use `cause` when an error wraps an original error:

```ts
try {
  await repository.save(user);
} catch (cause) {
  throw ValidationError({
    code: "SAVE_FAILED",
    cause,
  });
}
```

The original cause is preserved through the standard `Error` API.

## Type Inference

The factory derives the resulting error type from its configuration and each individual call.

```ts
const error = ValidationError({
  code: "INVALID_EMAIL",
  message: "The email is invalid.",
  context: {
    public: {
      field: "email",
    },
  },
});
```

The resulting type preserves available literal information such as:

```ts
error.code;
```

```text
"INVALID_EMAIL"
```

and:

```ts
error.message;
```

```text
"The email is invalid."
```

Context types are also resolved from the merged factory configuration and per-error options.

This allows application-specific errors to remain strongly typed without manually defining a separate error class for every error type.

## `BaseError`

`BaseError` is the underlying error class used by the factory.

It can also be used directly when a reusable factory is not needed:

```ts
import { BaseError } from "@opinionated-ts/error-factory";

const error = new BaseError({
  code: "INVALID_INPUT",
  message: "The provided input is invalid.",
  context: {
    public: {
      field: "email",
    },
  },
});
```

`BaseError` provides the common error structure:

- `code`
- `message`
- `context`
- `cause`
- `createdAt`

It also provides `toJSON()` for JSON serialization.

## How It Works

`createError` creates a callable factory backed by a generated error class.

When the factory is called:

1. Factory defaults, per-error options, and fixed values are resolved.
2. Object values such as `context` are merged recursively.
3. The resolved options are used to create a `BaseError`.
4. The resulting error keeps the configured `name`.
5. Its stack trace is captured at the factory call site.

The type system models the same resolution process so that the resulting error and the options accepted by the factory reflect the configured `defaults` and `fixed` values.

## Related

For functional error handling without throwing, `@opinionated-ts/result` can be used alongside this package:

[**@opinionated-ts/result**](https://github.com/opinionated-ts/result)

## License

MIT
