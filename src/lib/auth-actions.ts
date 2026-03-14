"use server";

import { signIn, signOut } from "@/auth";

/**
 * Attempts to sign in using email+OTP (the credentials provider).
 * The client code should obtain the email and otp ahead of time and
 * then call this helper.
 */
export async function signInWithEmail(email: string, otp: string, options?: { redirect?: boolean; assertionResponse?: string; }) {
    // options.redirect === false will return the result object instead of performing
    // a full redirect.  The login page may want to inspect success/failure.
    const opts: any = { email, otp };
    if (options?.assertionResponse) {
        opts.assertionResponse = options.assertionResponse;
    }
    if (options?.redirect === false) {
        opts.redirect = false;
    } else {
        opts.callbackUrl = "/home";
    }

    return await signIn("credentials", opts);
}

export async function signOutAction() {
    await signOut({ redirectTo: "/kakomon/login" });
}
