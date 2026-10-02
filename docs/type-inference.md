# Type Inference

The main goal of `@opinionated-ts/error-factory` is to make reusable errors strongly typed **without requiring manual error types**.

The factory captures the configuration you provide, and each call preserves the most specific values available.

## Exact literal inference

Consider:

```ts
const ValidationError = createError({
  name: "ValidationError",

  defaults: {
    message: "Validation failed.",
  },

  fixed: {
    code: "INVALID_EMAIL",
  },
});

const error = ValidationError({
  message: "The email address is invalid.",
});
```

The resulting values retain their literal types:

```ts
error.code;
// "INVALID_EMAIL"

error.message;
// "The email address is invalid."
```

They are not unnecessarily widened to:

```ts
string;
```

This lets the type system keep useful information about the specific error being created.

## Factory configuration participates in inference

Defaults are part of the resulting type:

```ts
const ValidationError = createError({
  fixed: {
    code: "INVALID_EMAIL",
  },
  defaults: {
    message: "Validation failed.",
  },
});

const error = ValidationError();
```

The message is inferred from the factory:

```ts
error.message;
// "Validation failed."
```

Per-error values are more specific and therefore replace the default:

```ts
const error = ValidationError({
  message: "The email address is invalid.",
});

error.message;
// "The email address is invalid."
```

## Fixed values are reflected in the API

A factory can control values through `fixed`:

```ts
const ApiError = createError({
  fixed: {
    code: "API_ERROR",
  },
});
```

The caller does not need to provide `code`:

```ts
const error = ApiError({
  message: "Request failed.",
});

error.code;
// "API_ERROR"
```

Providing another value for a fixed property is rejected:

```ts
ApiError({
  // @ts-expect-error
  code: "OTHER_ERROR",
});
```

This means the runtime rule and the public type contract stay aligned.

## Nested inference

Context is also inferred from the values provided by the factory and the individual error:

```ts
const ApiError = createError({
  fixed: {
    code: "REQUEST_FAILED",
  },
  defaults: {
    context: {
      internal: {
        source: "api",
      },
    },
  },
});

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

The resulting error keeps the combined shape:

```ts
error.context.internal.source;
// "api"

error.context.internal.requestId;
// "req_123"

error.context.public.field;
// "email"
```

The factory does not force every error to repeat shared context just to keep it typed.

## Partially fixed objects

Fixed values can also apply to part of a nested object:

```ts
const ApiError = createError({
  fixed: {
    code: "REQUEST_FAILED",
    context: {
      internal: {
        source: "api",
      },
    },
  },
});
```

The fixed property is controlled by the factory, while unrelated properties remain configurable:

```ts
ApiError({
  context: {
    internal: {
      requestId: "req_123",
    },
  },
});
```

The resulting context contains both values:

```ts
error.context.internal.source;
// "api"

error.context.internal.requestId;
// "req_123"
```

## Excess properties

The factory also checks the options passed to it rather than silently accepting unrelated properties:

```ts
const error = ValidationError({
  // @ts-expect-error
  unknownProperty: true,
});
```

This helps keep the actual error shape aligned with the declared factory configuration.

## Why this matters

Without this approach, reusable application errors often require one of two things:

- manually maintaining a type alongside the error implementation
- accepting broad types such as `string` and losing information about the specific error

`@opinionated-ts/error-factory` instead derives the type from the values you already write.

That makes the type declaration and the implementation the same source of truth.

## Explicit error types

The recommended approach is to let TypeScript infer the error type directly from each factory call.

If you need to reference the factory's return type explicitly, you can use `ReturnType`:

```ts
type ValidationErrorType = ReturnType<typeof ValidationError>;
```

This is **not recommended for specific error instances** because `ReturnType` describes the factory in general and cannot know which values a caller will provide, **so the exact inference of a specific factory call is lost**.

## Implementation notes

`createError` uses `const` type parameters and an exact options constraint to preserve literal values while still providing contextual typing and editor autocomplete.

The generated error type also reflects:

- the configured factory `name`
- the resolved `code`
- the resolved `message`
- the merged `context`
- whether `context` is guaranteed to exist

The inferred type follows the runtime behavior: `defaults` provides a value
unless the call supplies one, and `fixed` values always take precedence over
both. For `context`, objects are merged recursively, so this applies to
individual properties rather than replacing the entire context. This lets the
resulting error type describe the value the implementation actually creates.

## Next steps

- [Install the `create-error` skill](https://github.com/opinionated-ts/error-factory/tree/main/skills) — add package-specific guidance to your coding agent.
