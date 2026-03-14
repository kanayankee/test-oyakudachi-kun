import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { firestore } from "@/lib/firebaseAdmin";
import {
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, attestationResponse } = body;
  if (!email || !attestationResponse) {
    return NextResponse.json({ success: false, error: "missing fields" }, { status: 400 });
  }

  const challengeDoc = await firestore
    .collection("webauthn_challenges")
    .doc(email)
    .get();
  const expectedChallenge = challengeDoc.exists ? challengeDoc.data()?.challenge : undefined;

  const rpID = process.env.NEXTAUTH_URL! ? new URL(process.env.NEXTAUTH_URL!).hostname : "";
  const origin = process.env.NEXTAUTH_URL!;

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
      id: Buffer.from(regInfo.credentialID).toString("base64url"),
      publicKey: Buffer.from(regInfo.credentialPublicKey).toString("base64"),
      counter: regInfo.counter,
    }),
  }, { merge: true });

  return NextResponse.json({ success: true });
}
