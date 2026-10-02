# Getting Started

`@opinionated-ts/error-factory` lets you define reusable application errors while preserving their exact types through TypeScript inference.

## Install

Install with your preferred package manager:

```bash
bun add @opinionated-ts/error-factory
# pnpm add @opinionated-ts/error-factory
# yarn add @opinionated-ts/error-factory
# npm install @opinionated-ts/error-factory
```

## Create a factory

Define the shared shape of an error once:

```ts
import { createError } from "@opinionated-ts/error-factory";

export const ValidationError = createError({
  name: "ValidationError",

  defaults: {
    message: "Validation failed.",
  },

  fixed: {
    code: "INVALID_EMAIL",
  },
});
```

## Create an error

Call the factory directly:

```ts
const error = ValidationError({
  message: "The email address is invalid.",
  context: {
    public: {
      field: "email",
    },
  },
});
```

The resulting error is a regular `Error` instance:

```ts
error instanceof ValidationError; // true
error instanceof Error; // true

throw error;
```

Each factory-created error inherits from the package's internal `BaseError` class, which extends the native `Error`. This provides standard error behavior, including `cause` and stack traces, while the factory handles construction for you.

Its values are inferred from the factory and the call:

```ts
error.code; // "INVALID_EMAIL"
error.message; // "Validation failed."
error.context.public.field; // "email"
```

No custom error class or manual error type is required.

## Next steps

- [Creating Errors](./how-to-create-errors.md) — configure factories and create errors for different use cases.
