const { Client } = require("pg")
const fs = require("fs")
const path = require("path")

function getPassword() {
  const pwFile = path.join(__dirname, "..", ".db_password")
  try { return fs.readFileSync(pwFile, "utf-8").trim() } catch {}
  if (process.env.DB_PASSWORD) return process.env.DB_PASSWORD
  throw new Error("No password provided.")
}

async function tryConnectString(cs) {
  const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30000 })
  try {
    console.log(`  -> Trying connection string`)
    await client.connect()
    const res = await client.query("SELECT version()")
    console.log(`  ✅ CONNECTED: ${res.rows[0].version.substring(0, 60)}`)
    return client
  } catch (e) {
    await client.end().catch(() => {})
    console.log(`  ❌ ${e.message.substring(0, 120)}`)
    return null
  }
}

async function runMigration(client) {
  const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "00001_initial_schema.sql")
  const sql = fs.readFileSync(migrationPath, "utf-8")
  console.log("\nRunning migration...")
  await client.query(sql)
  console.log("✅ Migration completed!")
  await client.end()
}

async function main() {
  const ref = "ymwgfiazmlvgbdtlszbr"
  const pw = getPassword()
  const ePW = encodeURIComponent(pw)

  // Use connection strings with ?sslmode=require for proper SSL handling
  const strings = [
    `postgresql://${ref}:${ePW}@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require`,
    `postgresql://${ref}:${ePW}@aws-0-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require`,
    `postgresql://postgres.${ref}:${ePW}@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require`,
    `postgresql://postgres.${ref}:${ePW}@aws-0-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require`,
    `postgresql://${ref}:${ePW}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require`,
    `postgresql://${ref}:${ePW}@aws-0-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require`,
    `postgresql://postgres.${ref}:${ePW}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require`,
    `postgresql://postgres.${ref}:${ePW}@aws-0-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require`,
    // Direct connection
    `postgresql://postgres:${ePW}@${ref}.supabase.co:5432/postgres?sslmode=require`,
  ]

  console.log("Trying connection strings with sslmode=require...\n")

  for (const cs of strings) {
    const client = await tryConnectString(cs)
    if (client) {
      await runMigration(client)
      return
    }
  }

  console.error("\n❌ All attempts failed.")
  console.log("\nManual SQL Editor instructions:")
  console.log("https://supabase.com/dashboard/project/ymwgfiazmlvgbdtlszbr")
  process.exit(1)
}

main()
