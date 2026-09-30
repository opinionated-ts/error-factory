# Creating Errors

Use `createError` when multiple errors share a common configuration.

## Create a reusable factory

```ts
import { createError } from "@opinionated-ts/error-factory";

export const ValidationError = createError({
  name: "ValidationError",

  defaults: {
    message: "Validation failed.",
  },
});
```

Create individual errors by calling the factory:

```ts
const error = ValidationError({
  code: "INVALID_EMAIL",
  message: "The email address is invalid.",
});
```

Factories are callable functions. Do not use `new` with them.

## Share defaults

Use `defaults` for values that should be provided automatically but can still be overridden:

```ts
const ApiError = createError({
  defaults: {
    message: "An API error occurred.",
  },
});

ApiError({
  code: "REQUEST_FAILED",
  message: "The request could not be completed.",
});
```

The per-error value takes precedence over the default.

## Control fixed values

Use `fixed` for values that belong to the factory and must not be changed by individual errors:

```ts
const ApiError = createError({
  name: "ApiError",

  fixed: {
    code: "API_ERROR",
  },
});
```

The caller does not need to provide `code`:

```ts
const error = ApiError({
  message: "The request failed.",
});
```

Trying to provide another `code` is rejected by TypeScript.

### Combine defaults and fixed values

```ts
const ApiError = createError({
  name: "ApiError",

  defaults: {
    message: "An API error occurred.",
    context: {
      internal: {
        source: "api",
      },
    },
  },

  fixed: {
    code: "API_ERROR",
  },
});
```

Individual errors can still provide their own details:

```ts
const error = ApiError({
  message: "The request could not be completed.",
  context: {
    internal: {
      requestPath: "/users",
    },
  },
});
```

When the same value is set in more than one place, the factory resolves it like this: `defaults` supplies the starting value, and an individual call can replace it. A value in `fixed` is controlled by the factory, so it wins over both the default and the value passed to a call.

For example, the message in the call above replaces the default message. If the factory also set `message` in `fixed`, the fixed message would be used instead. TypeScript rejects attempts to pass a different value for a fixed property, but the runtime implementation still applies the factory's fixed value last.

For `context`, this rule applies to matching properties: objects are merged recursively, so a call can add context without losing shared values, while a fixed property takes precedence over a conflicting one.

## Error codes

Every created error needs a final `code`.

It can come from:

```ts
const AppError = createError({
  fixed: {
    code: "APP_ERROR",
  },
});

AppError();
```

or:

```ts
const AppError = createError({
  defaults: {
    code: "APP_ERROR",
  },
});

AppError();
```

or from the individual error:

```ts
const AppError = createError({});

AppError({
  code: "APP_ERROR",
});
```

## Context

Use `context.public` for information intended for error consumers:

```ts
const error = ValidationError({
  code: "INVALID_EMAIL",
  context: {
    public: {
      field: "email",
    },
  },
});
```

Use `context.internal` for operational information that should remain available on the error instance:

```ts
const error = ValidationError({
  code: "SAVE_FAILED",
  context: {
    internal: {
      requestId: "req_123",
      requestPath: "/users",
    },
  },
});

error.context.internal.requestId;
```

`context.public` is included in `toJSON()` and JSON serialization.

`context.internal` is omitted from that representation.

> [!WARNING]
>
> The omission of `internal` from JSON is not a security or confidentiality guarantee. Do not store secrets there.

## Causes

Use `cause` when wrapping an existing error:

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

The original cause remains available through the standard `Error` API.

## `instanceof`

Factory-created errors can be recognized with their factory:

```ts
const error = ValidationError({
  code: "INVALID_EMAIL",
});

error instanceof ValidationError; // true
error instanceof Error; // true
```

This makes factories useful when errors need to be handled by their specific type.

## Next steps

- [Type Inference](./type-inference.md) — see how the factory configuration shapes each error's type.
