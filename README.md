# @opinionated-ts/error-factory

[![npm version](https://img.shields.io/npm/v/@opinionated-ts/error-factory)](https://www.npmjs.com/package/@opinionated-ts/error-factory)
[![npm downloads](https://img.shields.io/npm/dm/@opinionated-ts/error-factory)](https://www.npmjs.com/package/@opinionated-ts/error-factory)
[![CI](https://img.shields.io/github/actions/workflow/status/opinionated-ts/error-factory/check-and-release.yml?label=CI)](https://github.com/opinionated-ts/error-factory/actions/workflows/check-and-release.yml)
[![License](https://img.shields.io/github/license/opinionated-ts/error-factory)](https://github.com/opinionated-ts/error-factory/blob/main/LICENSE)

Create type-safe application errors with **exact TypeScript inference**.

Define an error once. Reuse it everywhere. Let TypeScript keep the exact shape of every error you create.

> ❤️ If you find this project useful, consider giving the repo a star — it helps support the project.

## Why

Application errors should be consistent, reusable, and precisely typed.

`@opinionated-ts/error-factory` gives you reusable error factories with:

- **Exact type inference** — preserve literal values and the resulting error shape without manual type definitions.
- **Reusable factories** — define shared error behavior once and create as many typed errors as you need.
- **Controlled defaults** — share common messages and context while allowing per-error values.
- **Fixed values** — let the factory control values that callers should not change.
- **Structured context** — keep public and internal error data organized.
- **Native errors** — regular `Error` instances with `cause`, `instanceof`, stack traces, and `toJSON()`.

## Example

```ts
import { createError } from "@opinionated-ts/error-factory";

// Create an error factory
const ValidationError = createError({
  name: "ValidationError",

  // Default values are used when the caller does not provide a value.
  defaults: {
    message: "Validation failed.",
  },

  // Fixed values are always applied and cannot be overridden by the caller.
  fixed: {
    code: "VALIDATION_ERROR",
  },
});

// Create an error instance, or throw it directly with `throw ValidationError({...})`.
const error = ValidationError({
  message: "The email address is invalid.",
  context: {
    // Public context contains information that can safely be exposed to consumers.
    public: {
      field: "email",
      reason: "invalid_format",
    },

    // Internal context is excluded from `toJSON()`.
    internal: {
      validator: "email-format",
    },
  },
});

// The resulting values and their exact literal types are inferred automatically.
error.name; // "ValidationError"
error.code; // "VALIDATION_ERROR"
error.message; // "The email address is invalid."
error.context.public.field; // "email"
error.context.internal.validator; // "email-format"

error instanceof ValidationError; // true
error instanceof Error; // true
```

No custom error class. No manual error type. The type is inferred from the factory and the values you provide.

## Exact Type Inference

Exact inference does more than keep your errors type-safe. In editors like VS Code, it makes the complete shape of an error immediately accessible while you work.

For example, hovering over `error` shows its exact inferred type:

```ts
const error: ErrorInstance<
  "ValidationError",
  "VALIDATION_ERROR",
  "The email address is invalid.",
  {
    readonly public: {
      readonly field: "email";
      readonly reason: "invalid_format";
    };
    readonly internal: {
      readonly validator: "email-format";
    };
  },
  true
>;
```

When errors are evaluated later in a `switch`, `if`, or similar control flow, `Ctrl + Space` can surface the exact values and properties available at that point, while type checking keeps the code aligned with the actual error shape.

This makes errors easier to understand, inspect, and handle throughout your codebase without having to navigate back to where they were created.

See [Type Inference](./docs/type-inference.md) for more details and examples.

## Guides

- [Getting Started](./docs/getting-started.md) — install the package and create your first error factory.
- [Creating Errors](./docs/how-to-create-errors.md) — configure defaults, fixed values, context, and causes.
- [Type Inference](./docs/type-inference.md) — learn how factories preserve exact literal and nested types.
- [Install the `create-error` skill](./skills/README.md) — add this package's guidance to your coding agent.

## Related

This project is part of the [Opinionated TS](https://github.com/opinionated-ts) ecosystem, and here are some related projects:

- [`@opinionated-ts/result`](https://github.com/opinionated-ts/result) — handle failures as typed values so TypeScript can know which errors a piece of code may produce instead of throwing them.

## Open Source for the Community

Every project of the [Opinionated TS](https://github.com/opinionated-ts) ecosystem is **open source** and **free** for anyone to explore, use, or build on.

**Contributions are more than welcome — they're the whole point.**

- 💬 **Found a bug?** Open an issue.
- ✨ **Have an idea?** Start a discussion.
- 🔧 **Want to improve something?** Send a PR.

Whether it's a typo, a bug fix, a new feature, or an improvement — every contribution helps a lot.

## License

MIT
