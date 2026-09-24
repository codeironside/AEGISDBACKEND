export default () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodbUri:
    process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/aegis3d',
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ??
      'http://localhost:4000/v1/auth/google/callback',
  },
  frontend: {
    url: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  },
  auth: {
    sessionSecret:
      process.env.AUTH_SESSION_SECRET ?? 'dev-only-change-me-aegis3d',
    /** Fallback TTLs when site_settings rows are missing */
    sessionTtlSeconds: parseInt(process.env.AUTH_SESSION_TTL ?? '28800', 10),
    rememberMeTtlSeconds: parseInt(
      process.env.AUTH_REMEMBER_ME_TTL ?? '2592000',
      10,
    ),
  },
});
