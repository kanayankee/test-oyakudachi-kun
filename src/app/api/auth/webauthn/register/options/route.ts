import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebaseAdmin";
import { resolveWebauthnRelyingParty } from "@/lib/webauthn-relying-party";
import {
  generateRegistrationOptions,
} from "@simplewebauthn/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "メールアドレスが必要です" }, { status: 400 });
    }

    const userId = email;
    const { rpID } = resolveWebauthnRelyingParty(request);
    if (!rpID) {
      return NextResponse.json({ error: "rpIDを解決できませんでした" }, { status: 500 });
    }

    const options = await generateRegistrationOptions({
      rpName: "テストお役立ちくん",
      rpID,
      userID: userId,
      userName: email,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
      supportedAlgorithmIDs: [-7],
    });

    const challenge = (options as any).challenge;
    try {
      await firestore
        .collection("webauthn_challenges")
        .doc(email)
        .set({ challenge, createdAt: Date.now() }, { merge: true });
    } catch (persistErr: any) {
      // Some environments throw non-object errors. Continue with client-provided fallback challenge.
      const msg = persistErr && (persistErr.message || persistErr.stack || String(persistErr));
      console.log("[webauthn/register/options] challenge persist skipped:", msg || "unknown");
    }

    return NextResponse.json(options);
  } catch (err: any) {
    const msg = err && (err.message || err.stack || String(err));
    console.log("[webauthn/register/options] error:", msg || "unknown");
    return NextResponse.json({ error: msg || "internal error" }, { status: 500 });
  }
}
