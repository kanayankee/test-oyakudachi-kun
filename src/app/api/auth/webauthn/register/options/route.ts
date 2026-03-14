import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebaseAdmin";
import {
  generateRegistrationOptions,
} from "@simplewebauthn/server";

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "メールアドレスが必要です" }, { status: 400 });
  }

  const userId = email;
  const rpID = process.env.NEXTAUTH_URL! ? new URL(process.env.NEXTAUTH_URL!).hostname : "";
  const origin = process.env.NEXTAUTH_URL!;

  const options = generateRegistrationOptions({
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
  await firestore
    .collection("webauthn_challenges")
    .doc(email)
    .set({ challenge, createdAt: Date.now() }, { merge: true });

  return NextResponse.json(options);
}
