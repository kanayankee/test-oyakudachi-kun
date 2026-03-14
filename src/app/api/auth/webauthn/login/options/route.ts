import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebaseAdmin";
import { resolveWebauthnRelyingParty } from "@/lib/webauthn-relying-party";
import {
  generateAuthenticationOptions,
} from "@simplewebauthn/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    let credentials: any[] = [];
    if (email) {
      const doc = await firestore.collection("users").doc(email).get();
      if (doc.exists) {
        const data = doc.data();
        credentials = data?.credentials || [];
      }
    } else {
      const snapshot = await firestore.collection("users").get();
      snapshot.forEach((d) => {
        const data = d.data();
        if (Array.isArray(data.credentials)) {
          credentials.push(...data.credentials);
        }
      });
    }

    const allowCreds = credentials.map((c) => ({ id: c.id, type: "public-key" as const }));
    const { rpID } = resolveWebauthnRelyingParty(request);
    if (!rpID) {
      return NextResponse.json({ error: "rpIDを解決できませんでした" }, { status: 500 });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: allowCreds,
      userVerification: "preferred",
    });

    const challenge = (options as any).challenge;
    const docId = email || "__global__";
    try {
      await firestore
        .collection("webauthn_challenges")
        .doc(docId)
        .set({ challenge, createdAt: Date.now() });
    } catch (persistErr: any) {
      const msg = persistErr && (persistErr.message || persistErr.stack || String(persistErr));
      console.log("[webauthn/login/options] challenge persist skipped:", msg || "unknown");
    }

    return NextResponse.json(options);
  } catch (err: any) {
    const msg = err && (err.message || err.stack || String(err));
    console.log("[webauthn/login/options] error:", msg || "unknown");
    return NextResponse.json({ error: msg || "internal error" }, { status: 500 });
  }
}
