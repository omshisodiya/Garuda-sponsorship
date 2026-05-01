import { neon } from "@neondatabase/serverless"

export type Row = Record<string, unknown>
export type SqlFn = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>

let _client: SqlFn | null = null

export function db(): SqlFn {
  if (!_client) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error(
        "[Garuda] DATABASE_URL is not set.\n" +
        "1. Create a free PostgreSQL database at https://neon.tech\n" +
        "2. Copy the connection string (starts with postgres://)\n" +
        "3. Add  DATABASE_URL=<your-connection-string>  to .env.local\n" +
        "4. Add the same variable in Vercel → Project → Settings → Environment Variables"
      )
    }
    // Cast to a simple typed function — avoids the any[][]|Record[]|FullQueryResults union
    // that TypeScript can't index into directly.
    _client = neon(url) as unknown as SqlFn
  }
  return _client
}
