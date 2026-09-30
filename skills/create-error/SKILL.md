---
name: create-error
description: "Use for tasks involving `createError` from `@opinionated-ts/error-factory`, especially creating or configuring error factories, setting defaults or fixed values, and creating typed errors with codes, messages, context, or causes."
---

# Using `createError`

`createError` creates a reusable factory for a specific kind of error. The factory can define default values and controlled values that cannot be overridden by individual calls.

Keep factories close to the domain that uses them and give them descriptive names.

## Creating a factory

```ts
import { createError } from "@opinionated-ts/error-factory";

export const ValidationError = createError({
  name: "ValidationError",
  defaults: {
    message: "Validation failed",
  },
});
```

The factory is called directly; it is not instantiated with `new`.

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

The created error keeps the configured `name` and can be recognized with `instanceof`:

```ts
error instanceof ValidationError; // true
```

## `defaults` and `fixed`

Use `defaults` for shared values that an individual call may override.

Use `fixed` only for values that must remain under the factory's control.

`defaults` provides a starting value. A value passed when creating an error
replaces that default, while a value in `fixed` is controlled by the factory
and takes precedence over both. In other words, calls can customize defaults,
but cannot change fixed values.

For example:

```ts
export const ApiError = createError({
  name: "ApiError",
  defaults: {
    message: "An API error occurred.",
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

The call can provide a `message` and add additional context:

```ts
const error = ApiError({
  message: "Request failed.",
  context: {
    internal: {
      requestPath: "/users",
    },
  },
});
```

`code` cannot be overridden because it is defined in `fixed`. The runtime
implementation applies fixed values last, even if conflicting options reach
it; TypeScript also rejects those options in normal use.

Objects are merged recursively. This also allows only part of an object to be fixed while leaving its other properties configurable.

## `code` and `message`

Every error must have a final `code`.

It can come from:

- `fixed.code`
- the per-error `code`
- `defaults.code`

If neither `fixed` nor `defaults` provides a `code`, the call must provide one:

```ts
const AppError = createError({
  name: "AppError",
});

const error = AppError({
  code: "SOMETHING_FAILED",
});
```

`message` follows the same precedence, but it is optional. It can be defined in `defaults`, overridden by the call, or fixed through `fixed`.

## Context

Use `context.public` for data intended for error consumers:

```ts
context: {
  public: {
    field: "email",
  },
}
```

Use `context.internal` for operational information that should remain available on the instance:

```ts
context: {
  internal: {
    requestId: "req_123",
    requestPath: "/users",
  },
}
```

Context is merged recursively, so a call can add properties without replacing the entire context configured in `defaults`.

`context.public` is included in `error.toJSON()` and `JSON.stringify(error)`. `context.internal` is omitted from that representation but remains accessible on the error instance.

The omission of `internal` from JSON **is not a security or confidentiality guarantee**. Do not store secrets there.

## `cause`

Use `cause` when wrapping an original error:

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

The original cause is preserved through the standard `Error` API. It is not included in the object returned by `toJSON()`.

## Inferred types

The factory preserves available literal types from its configuration and each individual call.

For example:

```ts
const error = ValidationError({
  code: "INVALID_EMAIL",
  message: "The email is invalid.",
});
```

The resulting `error` type preserves `"INVALID_EMAIL"` and `"The email is invalid."` instead of necessarily widening them to `string`.

Use this inference to keep errors type-safe without manually declaring the type of every instance.

## Practical rules

- Use `createError` when you need a reusable error configuration.
- Use `defaults` for values that a call may customize.
- Use `fixed` only for values the factory must always control.
- Do not fix values that need to vary between requests.
- Use stable, descriptive error codes.
- Use `cause` when wrapping an original error.
- Separate consumer-facing data (`public`) from operational data (`internal`).
- Do not instantiate the factory with `new`.
- Do not put secrets in `context.internal`.

## Related

For functional error handling without throwing, optionally pair `@opinionated-ts/error-factory` with `@opinionated-ts/result` when available.
