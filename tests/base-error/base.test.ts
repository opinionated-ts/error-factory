import { describe, expect, it } from "vitest";

import { BaseError } from "@/base-error/base";

describe("BaseError", () => {
  it("should extend Error", () => {
    const error = new BaseError({ code: "TEST" });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseError);
  });

  it("should set the name from new.target.name", () => {
    class CustomError extends BaseError {}
    const error = new CustomError({ code: "TEST" });
    expect(error.name).toBe("CustomError");
  });

  it("should set code and message", () => {
    const error = new BaseError({ code: "TEST_CODE", message: "Test message" });
    expect(error.code).toBe("TEST_CODE");
    expect(error.message).toBe("Test message");
  });

  it("should set context", () => {
    const context = { public: { foo: "bar" }, internal: { baz: 1 } };
    const error = new BaseError({ code: "TEST", context });
    expect(error.context).toBe(context);
  });

  it("should set createdAt to ISO string", () => {
    const error = new BaseError({ code: "TEST" });
    expect(error.createdAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
  });

  it("should not include undefined cause in Error constructor", () => {
    const error = new BaseError({ code: "TEST" });
    // The cause property should not be present on the error instance
    expect("cause" in error).toBe(false);
  });

  it("should include cause when provided", () => {
    const cause = new Error("underlying");
    const error = new BaseError({ code: "TEST", cause });
    expect(error.cause).toBe(cause);
  });

  it("should include internal context in instance but not in JSON", () => {
    const error = new BaseError({
      code: "TEST",
      context: { internal: { secret: "value" }, public: { open: "value" } },
    });
    expect(error.context?.internal?.secret).toBe("value");
    const json = error.toJSON();
    expect(json.context).toEqual({ open: "value" });
  });

  it("should handle undefined context", () => {
    const error = new BaseError({ code: "TEST" });
    expect(error.context).toBeUndefined();
    const json = error.toJSON();
    expect(json.context).toBeUndefined();
  });

  it("should handle undefined message", () => {
    const error = new BaseError({ code: "TEST" });
    expect(error.message).toBe("");
  });
});
