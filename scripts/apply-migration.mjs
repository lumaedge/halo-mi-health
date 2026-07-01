import { readFileSync } from "fs"
import pg from "pg"

const sql = readFileSync(
  "C:/Users/L. Dlamini/OneDrive - Luzumane Holdings/Desktop/Medi Records/supabase/migrations/00002_emergency_info.sql",
  "utf8"
)

const pool = new pg.Pool({
  connectionString:
    "postgresql://postgres:Mel%26e5Hd*%2113@db.ymwgfiazmlvgbdtlszbr.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
})

pool
  .query(sql)
  .then((r) => {
    console.log("Migration applied successfully:", r.length, "statements executed")
    pool.end()
  })
  .catch((e) => {
    console.error("Error:", e.message)
    pool.end()
  })
