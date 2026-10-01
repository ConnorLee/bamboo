import postgres from 'postgres';
import { requireConfiguration } from './config';

let sql: ReturnType<typeof postgres> | undefined;
export function database() {
  // Use a provider's TLS-enabled pooled URL in production. Do not disable certificate verification.
  return sql ||= postgres(requireConfiguration().databaseUrl, {
    max: 5, idle_timeout: 20, connect_timeout: 10, prepare: false,
  });
}

export async function closeDatabase() {
  await sql?.end();
  sql = undefined;
}
