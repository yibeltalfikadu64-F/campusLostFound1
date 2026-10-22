import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/campus_lost_found?schema=public',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'injibara_campus_super_secure_access_secret_key_change_in_production_2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'injibara_campus_super_secure_refresh_secret_key_change_in_production_2026',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  adminBootstrap: {
    email: (process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@injibara.edu.et').toLowerCase(),
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD || 'ChangeThisPasswordInjibara2026!',
    name: process.env.ADMIN_BOOTSTRAP_NAME || 'Injibara Campus Security Admin',
    phone: process.env.ADMIN_BOOTSTRAP_PHONE || '+251911223344',
    universityId: process.env.ADMIN_BOOTSTRAP_ID || 'ADM-001'
  }
};
