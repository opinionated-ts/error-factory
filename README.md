# @opinionated-ts/error-factory

Create type-safe application errors with **exact TypeScript inference**.

Define an error once. Reuse it everywhere. Let TypeScript keep the exact shape of every error you create.

> [!WARNING]
>
> This project is not yet recommended for production use.
>
> The API is established, but further testing and real-world validation are needed before `1.0.0`.

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

const ValidationError = createError({
  name: "ValidationError",

  defaults: {
    message: "Validation failed.",
  },
});

const error = ValidationError({
  code: "INVALID_EMAIL",
  message: "The email address is invalid.",
  context: {
    public: {
      field: "email",
    },
  },
});

error.code; // "INVALID_EMAIL"
error.message; // "The email address is invalid."
error.context?.public?.field; // "email"

error instanceof ValidationError; // true
```

No custom error class. No manual error type. The type is inferred from the factory and the values you provide.

## Guides

- [Getting Started](./docs/getting-started.md) — install the package and create your first error factory.
- [Creating Errors](./docs/how-to-create-errors.md) — configure defaults, fixed values, context, and causes.
- [Type Inference](./docs/type-inference.md) — learn how factories preserve exact literal and nested types.
- [Install the `create-error` skill](./skills/README.md) — add this package's guidance to your coding agent.

## Related

Part of the [Opinionated TS](https://github.com/opinionated-ts) ecosystem.

- [`@opinionated-ts/result`](https://github.com/opinionated-ts/result) — handle expected failures as typed `Result` values instead of throwing.
- [`package-template`](https://github.com/opinionated-ts/package-template) — an experimental template for TypeScript packages, libraries, CLIs, and SDKs.
- [`web-template`](https://github.com/opinionated-ts/web-template) — an experimental template for TypeScript web projects.

## License

MIT
