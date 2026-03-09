import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        MicrosoftEntraID({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
            authorization: {
                params: {
                    prompt: "select_account",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            const email = user.email;
            if (!email) return false;

            const [prefix, domain] = email.split("@");

            if (domain !== "doshisha-js.ed.jp") {
                // Different domain: Encourage re-login with school account
                return "/login?error=domain_mismatch";
            }

            // Student ID format: d + 6 digits (e.g., d240123)
            const studentIdRegex = /^d\d{6}$/;
            if (!studentIdRegex.test(prefix)) {
                // School domain but not a student (Teacher/Staff)
                return "/login?error=not_a_student";
            }

            return true;
        },
        async jwt({ token, account, user }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            // Add userId (email prefix) to session if available
            if (session.user?.email) {
                (session.user as any).userId = session.user.email.split("@")[0];
            }
            return session;
        },
    },
    pages: {
        signIn: "/kakomon/login",
    },
});
