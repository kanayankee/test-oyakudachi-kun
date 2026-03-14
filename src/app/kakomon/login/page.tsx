"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import MultiDigitInput from "@/components/MultiDigitInput";
import { signIn } from "next-auth/react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import Loading from "@/app/loading";

export default function LoginPage() {
    const [stage, setStage] = useState<"email" | "otp">("email");
    const [emailDigits, setEmailDigits] = useState("");
    const [otpDigits, setOtpDigits] = useState("");
    const [error, setError] = useState("");
    const [timer, setTimer] = useState(0);
    const timerRef = useRef<number | null>(null);
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user) {
            router.push("/home");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (timer > 0) {
            timerRef.current = window.setTimeout(() => setTimer(timer - 1), 1000);
        }
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [timer]);

    const fullEmail = `d${emailDigits}@doshisha-js.ed.jp`;
    const searchParams = useSearchParams();
    const [returnTo, setReturnTo] = useState<string | null>(null);

    const [isNewUser, setIsNewUser] = useState<boolean>(false);

    const [sending, setSending] = useState(false);
    const [authenticating, setAuthenticating] = useState(false);
    const [canUseWebauthn, setCanUseWebauthn] = useState(false);

    // determine WebAuthn availability on client only to avoid SSR mismatch
    useEffect(() => {
        setCanUseWebauthn(typeof window !== "undefined" && (navigator as any).credentials);
    }, []);
    const [hasRegisteredPasskey, setHasRegisteredPasskey] = useState<boolean>(false);
    const [shouldRegisterPasskeyAfterOtp, setShouldRegisterPasskeyAfterOtp] = useState<boolean>(false);
    const [willPromptPasskeyAfterOtp, setWillPromptPasskeyAfterOtp] = useState<boolean>(false);

    const navigateAfterLogin = () => {
        if (returnTo && !fullEmail.startsWith("d021")) {
            router.push(returnTo);
        } else {
            router.push("/home");
        }
    };

    const tryPasskeyLogin = async (email: string) => {
        setAuthenticating(true);
        const resp = await fetch("/api/auth/webauthn/login/options", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        const opts = await resp.json();
        const assertionResponse = await startAuthentication(opts);
        const result: any = await signIn("credentials", {
            email,
            otp: "",
            redirect: false,
            assertionResponse,
        } as any);

        if (!result || (typeof result === "object" && !result.ok)) {
            setAuthenticating(false);
            throw new Error(result?.error || "パスキー認証に失敗しました");
        }
    };

    const sendOtp = async () => {
        setError("");
        setSending(true);
        try {
            // check whether account already exists
            const existsRes = await fetch(`/api/auth/users/exists?email=${encodeURIComponent(fullEmail)}`);
            const existsJson = await existsRes.json();
            setIsNewUser(!existsJson.exists);
            setHasRegisteredPasskey(!!existsJson.hasPasskey);
            setShouldRegisterPasskeyAfterOtp(false);
            setWillPromptPasskeyAfterOtp(canUseWebauthn && !existsJson.hasPasskey);

            const rt = searchParams.get("returnTo");
            if (rt) setReturnTo(rt);

            if (existsJson.exists && existsJson.hasPasskey && canUseWebauthn) {
                try {
                    await tryPasskeyLogin(fullEmail);
                    navigateAfterLogin();
                    return;
                } catch (e: any) {
                    setAuthenticating(false);
                    console.error("passkey-first login failed", e);
                    setShouldRegisterPasskeyAfterOtp(true);
                    setError("このアカウントには登録済みパスキーがあります。まずパスキー認証を試しましたが、この端末では使えなかったため認証コードに切り替えます。ログイン後にこの端末のパスキー登録を促します。");
                }
            }

            const res = await fetch("/api/auth/otp/send", {
                method: "POST",
                body: JSON.stringify({ email: fullEmail }),
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.error || "送信に失敗しました");
                setSending(false);
                return;
            }
            setStage("otp");
            setTimer(60);
        } catch (e: any) {
            setError(e.message || "送信エラー");
        } finally {
            setSending(false);
        }
    };

    const registerPasskey = async () => {
        // full WebAuthn registration via simplewebauthn/browser helper
        try {
            const optRes = await fetch("/api/auth/webauthn/register/options", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: fullEmail }),
            });
            const options = await optRes.json();
            const registrationResponse = await startRegistration(options);
            // send response to server for verification
            await fetch("/api/auth/webauthn/register/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: fullEmail, attestationResponse: registrationResponse }),
            });
        } catch (e) {
            console.error("passkey registration failed", e);
            throw e;
        }
    };

    const verifyOtpCode = async () => {
        setError("");
        setAuthenticating(true);
        try {
            const result: any = await signIn("credentials", { email: fullEmail, otp: otpDigits, redirect: false });
            if (!result || (typeof result === "object" && (result.error || !result.ok))) {
                setError(result?.error || "認証コードが正しくありません");
                setAuthenticating(false);
                return;
            }
            // registration flow for new users
            if ((isNewUser || shouldRegisterPasskeyAfterOtp || (!hasRegisteredPasskey && canUseWebauthn)) && typeof window !== "undefined" && (navigator as any).credentials) {
                try {
                    await registerPasskey();
                } catch (e) {
                    setError("パスキーの登録に失敗しました。");
                    setAuthenticating(false);
                    return;
                }
            }
            // after everything is done, navigate accordingly
            navigateAfterLogin();
        } catch (e: any) {
            setError(e.message || "認証に失敗しました");
            setAuthenticating(false);
        }
    };

    const handleResend = () => {
        if (timer === 0) sendOtp();
    };

    if (isLoading || authenticating) {
        return <Loading />;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-soft border border-primary/10 p-6 sm:p-10 text-center">
                <div className="mb-8 flex justify-center">
                    <div className="w-32 h-32 rounded-3xl flex items-center justify-center">
                        <img src="/icon.png" alt="Logo" className="w-32 h-32" />
                    </div>
                </div>

                <h2 className="text-3xl font-black text-foreground mb-4">
                    🔐 生徒専用ページ
                </h2>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm font-bold p-4 rounded-2xl mb-6 flex items-center gap-2 justify-center">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {stage === "email" && (
                    <>
                        <p className="mb-4 text-zinc-500">メールアドレス</p>
                        <div className="flex flex-col items-center justify-center gap-4 mb-8">
                            <div className="flex justify-center items-center gap-2">
                                <span className="font-bold text-3xl">d</span>
                                <MultiDigitInput
                                    length={6}
                                    value={emailDigits}
                                    onChange={(v) => setEmailDigits(v)}
                                    autoFocus
                                />
                            </div>
                            <span className="font-bold text-sm">@doshisha-js.ed.jp</span>
                            <p className="text-sm text-zinc-500">
                                メールが届かない場合は迷惑メールフォルダもご確認ください。
                            </p>
                            {hasRegisteredPasskey && canUseWebauthn && (
                                <p className="text-sm text-zinc-500">
                                    このアカウントには登録済みパスキーがあります。認証コード送信の前にパスキー認証を優先します。
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                disabled={emailDigits.length !== 6 || sending}
                                onClick={sendOtp}
                                className="w-full bg-primary text-white py-3 rounded-lg disabled:opacity-50"
                            >
                                {sending ? "送信中…" : "認証コードを送信"}
                            </button>
                            <button
                                disabled={!canUseWebauthn}
                                onClick={async () => {
                                    setError("");
                                    try {
                                        await tryPasskeyLogin(emailDigits.length === 6 ? fullEmail : "");
                                        navigateAfterLogin();
                                    } catch (e: any) {
                                        console.error(e);
                                        setError("パスキー認証ができませんでした");
                                    }
                                }}
                                className="w-full bg-white border border-zinc-300 py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <span className="text-xl">🔒</span>
                                <span>生体認証でログイン</span>
                            </button>
                        </div>
                    </>
                )}

                {stage === "otp" && (
                    <>
                        <p className="mb-4 text-zinc-500">届いた認証コードを入力してください</p>
                        <MultiDigitInput
                            length={4}
                            value={otpDigits}
                            onChange={(v) => setOtpDigits(v)}
                            className="justify-center mx-auto"
                        />
                        <button
                            disabled={otpDigits.length !== 4 || authenticating}
                            onClick={verifyOtpCode}
                            className="w-full bg-primary text-white py-3 rounded-lg mt-6 disabled:opacity-50"
                        >
                            ログイン / 登録する
                        </button>
                        <p className="mt-2 text-sm text-zinc-500">
                            メールが届かない場合は迷惑メールフォルダもご確認ください。
                        </p>
                        {willPromptPasskeyAfterOtp && (
                            <p className="mt-2 text-sm text-zinc-500">
                                ログイン後に、この端末で利用できるパスキー登録画面が表示されます。
                            </p>
                        )}
                        <div className="mt-4 text-sm">
                            {timer > 0 ? (
                                <span>{timer}秒後に再送信可能</span>
                            ) : (
                                <button onClick={handleResend} className="underline">
                                    コードを再送信する
                                </button>
                            )}
                        </div>
                    </>
                )}

                <div className="mt-12 pt-8 border-t border-zinc-100">
                    <p className="text-xs font-bold text-zinc-400 mb-2">
                        ログインに関するお困りごとは
                    </p>
                    <a
                        href="mailto:test.oyakudachi@gmail.com"
                        className="text-primary font-black hover:underline underline-offset-4"
                    >
                        test.oyakudachi@gmail.com
                    </a>
                </div>
            </div>
        </div>
    );
}
