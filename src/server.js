import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./lib/db.js";

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`🔮 AstroVeda backend running on http://localhost:${PORT}`);
  });
}

start();
