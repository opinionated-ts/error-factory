type CaptureStackTrace = (targetObject: object, constructorOpt?: Function) => void;

const captureStackTraceImpl = (
  Error as ErrorConstructor & {
    captureStackTrace?: CaptureStackTrace;
  }
).captureStackTrace;

/**
 * Captures an error stack trace while excluding the specified internal
 * factory frame when the runtime provides a compatible `Error.captureStackTrace`
 * implementation.
 *
 * The runtime function is resolved once when this module is loaded.
 *
 * @param error - Error whose stack trace should be captured.
 * @param constructor - Factory or constructor frame to exclude from the trace.
 */
export function captureStackTrace(error: Error, constructor?: Function): void {
  captureStackTraceImpl?.(error, constructor);
}
