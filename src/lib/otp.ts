import { firestore } from "./firebaseAdmin";

const COLLECTION = "otps";
const EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes

function generateCode() {
  // four‐digit one‑time code (0000–9999, leading zeroes allowed)
  const n = Math.floor(Math.random() * 10000);
  return n.toString().padStart(4, "0");
}

/**
 * Create a new OTP or reuse an existing unexpired one.
 */
export async function getOrCreateOtp(email: string) {
  const docRef = firestore.collection(COLLECTION).doc(email);
  const snapshot = await docRef.get();
  const now = Date.now();
  if (snapshot.exists) {
    const data = snapshot.data();
    if (data && data.expiresAt && data.expiresAt > now) {
      return data.code as string;
    }
  }

  const code = generateCode();
  await docRef.set({
    code,
    expiresAt: now + EXPIRATION_MS,
    createdAt: now,
  });
  return code;
}

/**
 * Verify that a provided code matches and is still valid.
 */
export async function verifyOtp(email: string, code: string) {
  const docRef = firestore.collection(COLLECTION).doc(email);
  const snapshot = await docRef.get();
  if (!snapshot.exists) return false;

  const data = snapshot.data();
  const now = Date.now();
  if (!data || !data.code || !data.expiresAt) return false;
  if (data.expiresAt < now) return false;
  const match = data.code === code;
  if (!match) {
    console.log(`[otp.verify] email=${email} entered=${code} stored=${data.code}`);
  }
  return match;
}
