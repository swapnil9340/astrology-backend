import mongoose from "mongoose";
import dns from "node:dns";

let connected = false;

/** Connect to MongoDB once. Safe to call on server start. */
export async function connectDB() {
  if (connected) return mongoose.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI missing in .env");
  }

  // Some machines have a local DNS resolver that refuses SRV lookups
  // (needed by mongodb+srv://). Override with public DNS if configured.
  if (process.env.DNS_SERVERS) {
    try {
      dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
    } catch (e) {
      console.warn("Could not set DNS servers:", e.message);
    }
  }

  mongoose.set("strictQuery", true);

  const dbName = process.env.MONGODB_DB || "astroveda";
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15000 });

  connected = true;
  console.log(`🗄️  MongoDB connected → db "${dbName}"`);

  mongoose.connection.on("error", (err) => console.error("MongoDB error:", err.message));
  mongoose.connection.on("disconnected", () => {
    connected = false;
    console.warn("MongoDB disconnected");
  });

  return mongoose.connection;
}
