import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyOtp } from "@/lib/otp";
import { firestore } from "@/lib/firebaseAdmin";

function normalizeStoredCredentialId(rawId: unknown): string | null {
    if (typeof rawId !== "string" || !rawId) {
        return null;
    }

    try {
        const decodedUtf8 = Buffer.from(rawId, "base64url").toString("utf8");
        if (/^[A-Za-z0-9_-]+$/.test(decodedUtf8)) {
            return decodedUtf8;
        }
    } catch {
        // Keep raw value as-is.
    }

    return rawId;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        CredentialsProvider({
            name: "メール認証",
            credentials: {
                email: { label: "メールアドレス", type: "text" },
                otp: { label: "認証コード", type: "text" },
                // webauthn payloads can also be passed here; the authorize function
                // inspects the body and decides which authentication method to run.
                assertionResponse: { label: "webauthnResponse", type: "text" },
            },
            async authorize(credentials: any, req) {
                if (!credentials) return null;
                const email = String(credentials.email || "");
                const otp = String(credentials.otp || "");
                console.log("[auth] authorize", { email, otp, assertion: !!credentials.assertionResponse });

                // passkey login
                if (credentials.assertionResponse) {
                    try {
                        const assertion = JSON.parse(credentials.assertionResponse as string);
                        const { id } = assertion;
                        let ownerEmail: string | null = null;
                        const snapshot = await firestore.collection("users").get();
                        snapshot.forEach((d) => {
                            const data = d.data();
                            const creds = data?.credentials || [];
                            if (creds.find((c: any) => normalizeStoredCredentialId(c?.id) === id)) {
                                ownerEmail = d.id;
                            }
                        });
                        if (!ownerEmail) return null;
                        return { id: ownerEmail, email: ownerEmail };
                    } catch (e) {
                        console.error("assertion parse/verify failed", e);
                        return null;
                    }
                }

                // otp login
                if (!email || !otp) {
                    console.log("[auth] missing email or otp", email, otp);
                    return null;
                }

                try {
                    const ok = await verifyOtp(email, otp);
                    console.log("[auth] verifyOtp result", email, otp, ok);
                    if (!ok) {
                        return null;
                    }

                    const userRef = firestore.collection("users").doc(email);
                    const snap = await userRef.get();
                    const isNew = !snap.exists;
                    console.log("[auth] user exists?", email, !isNew);
                    if (isNew) {
                        await userRef.set({ email, createdAt: Date.now() });
                    }

                    return { id: email, email, isNew };
                } catch (err) {
                    console.error("[auth] authorize otp flow error", err);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
        // make the session last effectively forever (10 years in seconds)
        // default maxAge is 30 days so we override it here.
        maxAge: 10 * 365 * 24 * 60 * 60,
        // updateAge determines how often the session token is updated in the
        // database, leave it at a day or so. Not critical for our long-lived
        // sessions but keep sane defaults.
        updateAge: 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    // ensure secret is set or warn early
    events: {
        async signIn(message) {
            if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
                console.warn("[auth] NEXTAUTH_SECRET/AUTH_SECRET is not defined; sessions may be insecure");
            }
        },
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // propagate isNew flag into token so session callback can read it
                (token as any).isNew = (user as any).isNew ?? false;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user?.email) {
                (session.user as any).userId = session.user.email.split("@")[0];
            }
            if ((token as any).isNew) {
                (session.user as any).isNew = true;
            }
            return session;
        },
    },
    pages: {
        signIn: "/kakomon/login",
    },
});
