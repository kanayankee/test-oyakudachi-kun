import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ exists: false, error: "missing email" }, { status: 400 });
    }
    const doc = await firestore.collection("users").doc(email).get();
    const data = doc.exists ? doc.data() : null;
    const credentials = Array.isArray(data?.credentials) ? data.credentials : [];
    return NextResponse.json({
      exists: doc.exists,
      hasPasskey: credentials.length > 0,
      credentialCount: credentials.length,
    });
  } catch (err: any) {
    // Sometimes Firestore throws an error object with null payload and
    // `console.error` in the Next.js runtime tries to serialize it which
    // crashes with "payload must be object".  Convert to a string first.
    const msg = err && (err.message || err.stack || String(err));
    console.error("/api/auth/users/exists error", msg);
    return NextResponse.json({ exists: false, error: msg || "internal" }, { status: 500 });
  }
}
