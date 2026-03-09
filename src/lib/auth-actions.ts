"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithMicrosoft() {
    await signIn("microsoft-entra-id", { redirectTo: "/" });
}

export async function signOutAction() {
    await signOut({ redirectTo: "/login" });
}
