import jwt from "jsonwebtoken";

// Get JWT_SECRET dynamically at runtime (not at module load time)
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn(
      "⚠️  JWT_SECRET not found in env, using default-secret (INSECURE!)"
    );
    return "default-secret";
  }
  return secret;
}

export function generateToken(userId: string): string {
  const JWT_SECRET = getJWTSecret();
  console.log(
    "🔑 Generating token with JWT_SECRET (first 10 chars):",
    JWT_SECRET.substring(0, 10)
  );
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const JWT_SECRET = getJWTSecret();
    console.log(
      "🔍 Verifying token with JWT_SECRET (first 10 chars):",
      JWT_SECRET.substring(0, 10)
    );
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    console.log("✅ Token verified successfully");
    return decoded;
  } catch (error: any) {
    console.error("❌ JWT verification error:", error.message);
    const JWT_SECRET = getJWTSecret();
    console.log("JWT_SECRET exists:", !!JWT_SECRET);
    console.log(
      "JWT_SECRET value (first 10 chars):",
      JWT_SECRET.substring(0, 10)
    );
    return null;
  }
}
