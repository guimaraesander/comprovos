import { afterEach, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";

afterEach(() => {
  vi.clearAllMocks();
});