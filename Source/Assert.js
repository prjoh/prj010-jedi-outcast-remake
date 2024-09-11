import { env } from './Env'


function assert(condition, message) {
  if (!env.ASSERT_ENABLE)
  {
    return;
  }

  if (!condition) {
      // Create an error object to capture the stack trace
      const error = new Error(message || "Assertion failed");

      // Extract the stack trace information
      const stackLines = error.stack.split('\n');

      // The relevant line is usually the third line in the stack trace
      const assertLocation = stackLines[2].trim();

      // Combine the custom message with the location info
      const fullMessage = `${message || "Assertion failed"} ${assertLocation}`;

      // Throw an error with the full message
      throw new Error(fullMessage);
  }
}

export { assert };
