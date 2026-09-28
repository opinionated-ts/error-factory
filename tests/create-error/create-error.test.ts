import { describe, expect, it } from "vitest";

import { createError } from "@/create-error/create-error";

describe("createError factory", () => {
  it("should create a factory with default name", () => {
    const factory = createError({});
    expect(factory.name).toBe("Error");
  });

  it("should create a factory with custom name", () => {
    const factory = createError({ name: "CustomError" });
    expect(factory.name).toBe("CustomError");
  });

  it("should require code when neither defaults nor fixed provide it", () => {
    const factory = createError({});
    // @ts-expect-error -- An error code must be provided
    expect(() => factory({})).toThrow("An error code is required");
  });

  it("should use defaults when no options are provided", () => {
    const factory = createError({
      defaults: {
        code: "DEFAULT_CODE",
        message: "Default message",
      },
    });
    const error = factory({});
    expect(error.code).toBe("DEFAULT_CODE");
    expect(error.message).toBe("Default message");
  });

  it("should allow options to override defaults", () => {
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
    expect(error.code).toBe("OVERRIDE_CODE");
    expect(error.message).toBe("Override message");
  });

  it("should allow fixed values to override defaults and options", () => {
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
    const error = factory({
      // @ts-expect-error -- the caller cannot override fixed factory properties
      code: "OVERRIDE_CODE",
      message: "Override message",
    });
    expect(error.code).toBe("FIXED_CODE");
    expect(error.message).toBe("Fixed message");
  });

  it("should merge context objects recursively", () => {
    const factory = createError({
      defaults: {
        code: "DEFAULTS",
        context: {
          public: { defaults: "value" },
          internal: { defaultsSecret: "secret" },
        },
      },
      fixed: {
        code: "FIXED",
        context: {
          public: { fixed: "value" },
          internal: { fixedSecret: "secret" },
        },
      },
    });
    const error = factory({
      context: {
        public: { options: "value" },
        internal: { optionsSecret: "secret" },
      },
    });
    expect(error.code).toBe("FIXED");
    expect(error.context).toEqual({
      public: {
        defaults: "value",
        options: "value",
        fixed: "value",
      },
      internal: {
        defaultsSecret: "secret",
        optionsSecret: "secret",
        fixedSecret: "secret",
      },
    });
  });

  it("should set the error name correctly", () => {
    const factory = createError({ name: "CustomError" });
    const error = factory({ code: "TEST" });
    expect(error.name).toBe("CustomError");
  });

  it("should capture stack trace", () => {
    const factory = createError({ name: "TestError" });
    const error = factory({ code: "TEST" });
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("TestError");
  });

  it("should allow options to override default cause", () => {
    const defaultCause = new Error("default");
    const optionsCause = new Error("options");

    const factory = createError({
      defaults: {
        code: "DEFAULT_CODE",
        cause: defaultCause,
      },
    });

    const error = factory({ cause: optionsCause });

    expect(error.cause).toBe(optionsCause);
  });

  it("should let fixed values override options for all scalar properties", () => {
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

    const error = factory({
      // @ts-expect-error -- fixed factory properties cannot be overridden
      code: "OVERRIDE_CODE",
      message: "Override message",
    });

    expect(error.code).toBe("FIXED_CODE");
    expect(error.message).toBe("Fixed message");
  });

  it("should omit context when no context is configured or provided", () => {
    const factory = createError({
      defaults: {
        code: "TEST",
      },
    });

    const error = factory({});

    expect(error.context).toBeUndefined();
  });

  it("should preserve context when only defaults provide it", () => {
    const factory = createError({
      defaults: {
        code: "TEST",
        context: {
          public: {
            requestPath: "/",
          },
        },
      },
    });

    const error = factory({});

    expect(error.context).toEqual({
      public: {
        requestPath: "/",
      },
    });
  });

  it("should preserve context when only fixed values provide it", () => {
    const factory = createError({
      defaults: {
        code: "TEST",
      },
      fixed: {
        context: {
          internal: {
            source: "api",
          },
        },
      },
    });

    const error = factory({});

    expect(error.context).toEqual({
      internal: {
        source: "api",
      },
    });
  });

  it("should make created errors instances of the factory", () => {
    const factory = createError({
      name: "CustomError",
    });

    const error = factory({
      code: "TEST",
    });

    expect(error).toBeInstanceOf(factory);
    expect(error).toBeInstanceOf(Error);
  });
});
