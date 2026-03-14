"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import MultiDigitInput from "@/components/MultiDigitInput";
import { signIn } from "next-auth/react";
import { startAuthentication } from "@simplewebauthn/browser";
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
            const uid = (user.email || "").split("@")[0] || "";
            if (uid.startsWith("d021")) {
                router.replace("/kakomon/2");
            } else {
                router.replace("/home");
            }
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

    const [sending, setSending] = useState(false);
    const [authenticating, setAuthenticating] = useState(false);
    const [canUseWebauthn, setCanUseWebauthn] = useState(false);

    // determine WebAuthn availability on client only to avoid SSR mismatch
    useEffect(() => {
        setCanUseWebauthn(typeof window !== "undefined" && (navigator as any).credentials);
    }, []);
    const [hasRegisteredPasskey, setHasRegisteredPasskey] = useState<boolean>(false);

    const isPasskeyCancelError = (err: any) => {
        const name = err?.name || "";
        const message = String(err?.message || "");
        return name === "NotAllowedError" || name === "AbortError" || /cancel|canceled|aborted/i.test(message);
    };

    const isNoSavedPasskeyError = (err: any) => {
        const message = String(err?.message || "").toLowerCase();
        return /no passkey|no saved|not available|credential|保存済みパスワードまたはパスキーはありません/.test(message);
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        const ua = window.navigator.userAgent || "";
        if (!/Line\//i.test(ua)) return;

        const current = new URL(window.location.href);
        if (current.searchParams.get("openexternalbrowser") === "1") return;
        current.searchParams.set("openexternalbrowser", "1");
        window.location.href = current.toString();
    }, []);

    const navigateAfterLogin = () => {
        if (fullEmail.startsWith("d021")) {
            window.location.assign("/kakomon/2");
            return;
        }
        if (returnTo) {
            window.location.assign(returnTo);
        } else {
            window.location.assign("/home");
        }
    };

    const tryPasskeyLogin = async (email: string): Promise<"success" | "cancelled"> => {
        setAuthenticating(true);
        try {
            const getOptions = async (payload: Record<string, string>) => {
                const resp = await fetch("/api/auth/webauthn/login/options", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const opts = await resp.json().catch(() => null);
                if (!resp.ok) {
                    throw new Error(opts?.error || `パスキー認証オプションの取得に失敗しました (${resp.status})`);
                }
                return opts;
            };

            let opts = await getOptions({ email });
            let assertionResponse: any;
            try {
                assertionResponse = await startAuthentication(opts);
            } catch (firstErr: any) {
                if (!isNoSavedPasskeyError(firstErr)) {
                    throw firstErr;
                }
                // Fallback: allow discoverable passkeys when account-filtered credentials are unavailable on this client.
                opts = await getOptions({});
                assertionResponse = await startAuthentication(opts);
            }
            const result: any = await signIn("credentials", {
                email,
                otp: "",
                redirect: false,
                assertionResponse: JSON.stringify(assertionResponse),
            } as any);

            if (!result || (typeof result === "object" && !result.ok)) {
                throw new Error(result?.error || "パスキー認証に失敗しました");
            }
            return "success";
        } catch (err: any) {
            if (isPasskeyCancelError(err)) {
                return "cancelled";
            }
            throw err;
        } finally {
            setAuthenticating(false);
        }
    };

    const sendOtp = async () => {
        setError("");
        setSending(true);
        try {
            // check whether account already exists
            const existsRes = await fetch(`/api/auth/users/exists?email=${encodeURIComponent(fullEmail)}`);
            const existsJson = await existsRes.json();
            const hasPasskey = !!existsJson.hasPasskey;
            setHasRegisteredPasskey(hasPasskey);

            const rt = searchParams.get("returnTo");
            if (rt) setReturnTo(rt);

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

    if (isLoading || authenticating || !!user) {
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
                                    autoComplete="off"
                                />
                            </div>
                            <span className="font-bold text-sm">@doshisha-js.ed.jp</span>
                            <p className="text-sm text-zinc-500">
                                メールが届かない場合は迷惑メールフォルダもご確認ください。
                            </p>
                            {hasRegisteredPasskey && canUseWebauthn && (
                                <p className="text-sm text-zinc-500">
                                    このアカウントは生体認証でもログインできます。
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
                                        if (emailDigits.length !== 6) {
                                            setError("先に学籍番号（6桁）を入力してください");
                                            return;
                                        }
                                        const passkeyResult = await tryPasskeyLogin(emailDigits.length === 6 ? fullEmail : "");
                                        if (passkeyResult === "success") {
                                            navigateAfterLogin();
                                        }
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
                            autoComplete="one-time-code"
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
