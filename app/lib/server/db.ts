import { neon } from "@neondatabase/serverless"

let _client: ReturnType<typeof neon> | null = null

export function db() {
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
    _client = neon(url)
  }
  return _client
}
