"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { signInWithMicrosoft } from "@/lib/auth-actions";

export default function LoginPage() {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState("");
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const errorParam = searchParams.get("error");

    useEffect(() => {
        if (errorParam === "domain_mismatch") {
            setError("学校提供の @doshisha-js.ed.jp アカウントでサインインしてください。");
        } else if (errorParam === "not_a_student") {
            setError("このサイトは生徒専用です。教職員用のアカウントでは利用できません。");
        }
    }, [errorParam]);

    useEffect(() => {
        if (!isLoading && user) {
            router.push("/home");
        }
    }, [user, isLoading, router]);

    const handleMicrosoftLogin = async () => {
        setIsLoggingIn(true);
        setError("");
        try {
            await signInWithMicrosoft();
        } catch (e: any) {
            setError("ログインに失敗しました。もう一度お試しください。");
            setIsLoggingIn(false);
        }
    };

    if (isLoading) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-soft border border-primary/10 p-8 sm:p-12 text-center">
                <div className="mb-8 flex justify-center">
                    <div className="w-32 h-32 rounded-3xl flex items-center justify-center">
                        <img src="/icon.png" alt="Logo" className="w-32 h-32" />
                    </div>
                </div>

                <h2 className="text-3xl font-black text-foreground mb-4">
                    🔐 生徒専用ページ
                </h2>
                <p className="text-zinc-500 font-bold mb-10 leading-relaxed">
                    学校の Microsoft アカウントで<br />
                    サインインしてください
                </p>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm font-bold p-4 rounded-2xl mb-6 flex items-center gap-2 justify-center">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <div className="relative group">
                    <button
                        onClick={handleMicrosoftLogin}
                        disabled={true}
                        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-zinc-100 py-5 rounded-[2rem] transition-all opacity-50 cursor-not-allowed"
                    >
                        <img
                            src="/login.svg"
                            alt="Microsoft"
                            className="w-10 h-10"
                        />
                        <span className="text-xl font-black text-zinc-700">Microsoft でサインイン</span>
                    </button>
                    {/* 準備中オーバーレイ */}
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/10 rounded-[2rem] pointer-events-none">
                        <span className="bg-zinc-800 text-white text-sm font-black px-4 py-1 rounded-full shadow-lg transform -rotate-3">
                            準備中
                        </span>
                    </div>
                </div>

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
