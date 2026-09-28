import { expectTypeOf, it } from "vitest";

import { createError } from "@/create-error/create-error";

it("should infer the default code as a literal type", () => {
  const factory = createError({
    defaults: {
      code: "DEFAULT_CODE",
    },
  });

  const error = factory({});

  expectTypeOf(error.code).toEqualTypeOf<"DEFAULT_CODE">();
});

it("should allow caller options to override defaults", () => {
  const factory = createError({
    defaults: {
      code: "DEFAULT_CODE",
      message: "Default message",
    },
  });

  const error = factory({
    code: "OVERRIDE_CODE",
    message: "Override message",
  });

  expectTypeOf(error.code).toEqualTypeOf<"OVERRIDE_CODE">();
  expectTypeOf(error.message).toEqualTypeOf<"Override message">();
});

it("should preserve default types when caller does not override them", () => {
  const factory = createError({
    defaults: {
      code: "DEFAULT_CODE",
      message: "Default message",
    },
  });

  const error = factory({});

  expectTypeOf(error.code).toEqualTypeOf<"DEFAULT_CODE">();
  expectTypeOf(error.message).toEqualTypeOf<"Default message">();
});

it("should make fixed top-level properties non-overridable", () => {
  const factory = createError({
    defaults: {
      code: "DEFAULT_CODE",
      message: "Default message",
    },
    fixed: {
      code: "FIXED_CODE",
      message: "Fixed message",
    },
  });

  factory({});

  // @ts-expect-error -- fixed code cannot be overridden
  factory({ code: "OTHER_CODE" });

  // @ts-expect-error -- fixed message cannot be overridden
  factory({ message: "Other message" });
});

it("should preserve fixed literal types", () => {
  const factory = createError({
    defaults: {
      code: "DEFAULT_CODE",
    },
    fixed: {
      code: "FIXED_CODE",
      message: "Fixed message",
    },
  });

  const error = factory({});

  expectTypeOf(error.code).toEqualTypeOf<"FIXED_CODE">();
  expectTypeOf(error.message).toEqualTypeOf<"Fixed message">();
});

it("should allow non-fixed properties alongside fixed properties", () => {
  const factory = createError({
    defaults: {
      code: "DEFAULT_CODE",
      message: "Default message",
    },
    fixed: {
      code: "FIXED_CODE",
    },
  });

  const error = factory({
    message: "Custom message",
  });

  expectTypeOf(error.code).toEqualTypeOf<"FIXED_CODE">();
  expectTypeOf(error.message).toEqualTypeOf<"Custom message">();
});

it("should prevent overriding fixed nested context properties", () => {
  const factory = createError({
    defaults: {
      code: "DEFAULT_CODE",
      context: {
        public: {
          requestPath: "/",
        },
      },
    },
    fixed: {
      code: "FIXED_CODE",
      context: {
        internal: {
          source: "api",
        },
      },
    },
  });

  factory({
    context: {
      public: {
        requestPath: "/other",
      },
    },
  });

  factory({
    context: {
      internal: {
        // @ts-expect-error -- fixed nested properties cannot be overridden
        source: "other",
      },
    },
  });
});

it("should allow adding non-fixed nested context properties", () => {
  const factory = createError({
    defaults: {
      code: "DEFAULT_CODE",
      context: {
        public: {
          requestPath: "/",
        },
      },
    },
    fixed: {
      context: {
        internal: {
          source: "api",
        },
      },
    },
  });

  const error = factory({
    context: {
      public: {
        requestId: "123",
      },
      internal: {
        requestMethod: "GET",
      },
    },
  });

  expectTypeOf(error.code).toEqualTypeOf<"DEFAULT_CODE">();
});

it("should preserve literal inference with readonly inputs", () => {
  const defaults = {
    code: "DEFAULT_CODE",
    message: "Default message",
    context: {
      public: {
        requestPath: "/",
      },
    },
  } as const;

  const fixed = {
    code: "FIXED_CODE",
    context: {
      internal: {
        source: "api",
      },
    },
  } as const;

  const factory = createError({
    defaults,
    fixed,
  });

  const error = factory({
    message: "Custom message" as const,
  });

  expectTypeOf(error.code).toEqualTypeOf<"FIXED_CODE">();
  expectTypeOf(error.message).toEqualTypeOf<"Custom message">();
});

it("should require a code when defaults and fixed do not provide one", () => {
  const factory = createError({
    defaults: {
      message: "Default message",
    },
  });

  type FactoryOptions = Parameters<typeof factory>[0];

  // @ts-expect-error -- a code is required
  // oxlint-disable-next-line no-unused-vars
  const options: FactoryOptions = {};
});

it("should not require a code when defaults provide one", () => {
  const factory = createError({
    defaults: {
      code: "DEFAULT_CODE",
    },
  });

  factory({});
});

it("should not require a code when fixed provides one", () => {
  const factory = createError({
    fixed: {
      code: "FIXED_CODE",
    },
  });

  factory({});
});
