// Runs before every test file, so src/config/env.ts validates against these values.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_ACCESS_SECRET = "test-secret-test-secret-test-secret-123456";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.REFRESH_TOKEN_TTL_DAYS = "30";
