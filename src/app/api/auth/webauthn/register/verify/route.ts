import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { firestore } from "@/lib/firebaseAdmin";
import { resolveWebauthnRelyingParty } from "@/lib/webauthn-relying-party";
import {
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

function toBase64Url(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  return Buffer.from(value as ArrayBufferLike).toString("base64url");
}

function toBase64(value: unknown): string {
  if (typeof value === "string") {
    return Buffer.from(value, "base64url").toString("base64");
  }
  return Buffer.from(value as ArrayBufferLike).toString("base64");
}

export async function POST(request: Request) {
  const body = await request.json();
  const { email, attestationResponse, expectedChallenge: fallbackChallenge } = body;
  if (!email || !attestationResponse) {
    return NextResponse.json({ success: false, error: "missing fields" }, { status: 400 });
  }

  let expectedChallenge: string | undefined;
  try {
    const challengeDoc = await firestore
      .collection("webauthn_challenges")
      .doc(email)
      .get();
    expectedChallenge = challengeDoc.exists ? challengeDoc.data()?.challenge : undefined;
  } catch (e: any) {
    const msg = e && (e.message || e.stack || String(e));
    console.log("[webauthn/register/verify] challenge fetch skipped:", msg || "unknown");
  }
  if (!expectedChallenge && typeof fallbackChallenge === "string") {
    expectedChallenge = fallbackChallenge;
  }
  if (!expectedChallenge) {
    return NextResponse.json({ success: false, error: "expected challenge not found" }, { status: 400 });
  }

  const { rpID, origin } = resolveWebauthnRelyingParty(request);

  const verification = await verifyRegistrationResponse({
    response: attestationResponse,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });

  if (!verification.verified) {
    return NextResponse.json({ success: false, error: "verification failed" }, { status: 400 });
  }

  const regInfo = verification.registrationInfo!;
  const userRef = firestore.collection("users").doc(email);
  await userRef.set({
    email,
    credentials: admin.firestore.FieldValue.arrayUnion({
      id: toBase64Url(regInfo.credentialID),
      publicKey: toBase64(regInfo.credentialPublicKey),
      counter: regInfo.counter,
    }),
  }, { merge: true });

  return NextResponse.json({ success: true });
}
