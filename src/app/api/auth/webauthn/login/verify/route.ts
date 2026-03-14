import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebaseAdmin";
import { resolveWebauthnRelyingParty } from "@/lib/webauthn-relying-party";
import {
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, assertionResponse, expectedChallenge: fallbackChallenge } = body;
  if (!assertionResponse) {
    return NextResponse.json({ success: false, error: "missing assertion" }, { status: 400 });
  }

  const docId = email || "__global__";
  let expectedChallenge: string | undefined;
  try {
    const challengeDoc = await firestore
      .collection("webauthn_challenges")
      .doc(docId)
      .get();
    expectedChallenge = challengeDoc.exists ? challengeDoc.data()?.challenge : undefined;
  } catch (e: any) {
    const msg = e && (e.message || e.stack || String(e));
    console.log("[webauthn/login/verify] challenge fetch skipped:", msg || "unknown");
  }
  if (!expectedChallenge && typeof fallbackChallenge === "string") {
    expectedChallenge = fallbackChallenge;
  }
  if (!expectedChallenge) {
    return NextResponse.json({ success: false, error: "expected challenge not found" }, { status: 400 });
  }

  const { id } = assertionResponse;
  let storedCredential: any = null;
  let ownerEmail: string | null = email || null;
  if (email) {
    const doc = await firestore.collection("users").doc(email).get();
    if (doc.exists) {
      const creds = doc.data()?.credentials || [];
      storedCredential = creds.find((c: any) => c.id === id);
    }
  } else {
    const snapshot = await firestore.collection("users").get();
    snapshot.forEach((d) => {
      const creds = d.data()?.credentials || [];
      const found = creds.find((c: any) => c.id === id);
      if (found) {
        storedCredential = found;
        ownerEmail = d.id;
      }
    });
  }

  if (!storedCredential) {
    return NextResponse.json({ success: false, error: "credential not found" }, { status: 400 });
  }

  const { rpID, origin } = resolveWebauthnRelyingParty(request);

  const verification = await verifyAuthenticationResponse({
    response: assertionResponse,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: Buffer.from(storedCredential.id, "base64url"),
      credentialPublicKey: Buffer.from(storedCredential.publicKey, "base64"),
      counter: storedCredential.counter || 0,
    },
    requireUserVerification: true,
  });

  if (!verification.verified) {
    return NextResponse.json({ success: false, error: "verification failed" }, { status: 400 });
  }

  if (!ownerEmail) {
    return NextResponse.json({ success: false, error: "owner not found" }, { status: 400 });
  }

  // update counter in-place to avoid duplicate credentials and allow multi-passkey accounts
  const ownerRef = firestore.collection("users").doc(ownerEmail);
  const ownerSnap = await ownerRef.get();
  const ownerData = ownerSnap.data() || {};
  const currentCreds = Array.isArray(ownerData.credentials) ? ownerData.credentials : [];
  const updatedCreds = currentCreds.map((c: any) =>
    c.id === id ? { ...c, counter: verification.authenticationInfo.newCounter } : c
  );
  await ownerRef.set({ credentials: updatedCreds }, { merge: true });

  return NextResponse.json({ success: true, email: ownerEmail });
}
