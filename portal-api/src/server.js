// src/server.js
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

async function start() {
  const [{ createApp }, { connectDB }, { env }] = await Promise.all([
    import("./app.js"),
    import("./config/db.js"),
    import("./config/env.js"),
  ]);

  await connectDB();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`✅ Portal API running on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start:", err);
  process.exit(1);
});
