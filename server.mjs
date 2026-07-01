import express from "express"
import { createReadStream } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.static(join(__dirname, "dist")))

app.get("*", (_req, res) => {
  createReadStream(join(__dirname, "dist", "index.html")).pipe(res)
})

app.listen(PORT, () => {
  console.log(`Halo Mi Health web preview running on port ${PORT}`)
})
