import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebaseAdmin";
import {
  generateAuthenticationOptions,
} from "@simplewebauthn/server";

export async function POST(request: Request) {
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

  const allowCreds = credentials.map((c) => ({ id: c.id, type: "public-key" }));
  const rpID = process.env.NEXTAUTH_URL! ? new URL(process.env.NEXTAUTH_URL!).hostname : "";
  const options = generateAuthenticationOptions({
    rpID,
    allowCredentials: allowCreds,
    userVerification: "preferred",
  });

  const challenge = (options as any).challenge;
  const docId = email || "__global__";
  await firestore
    .collection("webauthn_challenges")
    .doc(docId)
    .set({ challenge, createdAt: Date.now() });

  return NextResponse.json(options);
}
