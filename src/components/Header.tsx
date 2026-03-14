"use client";

import Link from "next/link";
import { useAuth } from "./AuthContext";

export default function Header() {
    const { userId, gradeLabel, isD021, signOut, isLoading } = useAuth();

    return (
        <header className="w-full max-w-[1400px] px-4 md:px-8 py-4 flex flex-col gap-4 mt-4 z-50">
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-md rounded-xl shadow-soft p-4 sticky top-4">
                {isD021 ? (
                    <div className="flex items-center gap-3">
                        <img src="/icon.png" alt="Logo" className="w-10 h-10 rounded-full" />
                        <h1 className="text-xl font-bold text-foreground">同志社高校 テストお役立ちくん</h1>
                    </div>
                ) : (
                    <Link href="/home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img src="/icon.png" alt="Logo" className="w-10 h-10 rounded-full" />
                        <h1 className="text-xl font-bold text-foreground">同志社高校 テストお役立ちくん</h1>
                    </Link>
                )}

                <div className="flex items-center gap-4">
                    {!isLoading && userId && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-zinc-500 hidden sm:inline">
                                {userId}
                            </span>
                            {!isD021 && (
                                <button
                                    onClick={signOut}
                                    className="text-sm font-bold text-red-500 hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    ログアウト
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {!isLoading && userId && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="text-sm font-bold text-zinc-700">
                        🎓 <span className="text-primary">{gradeLabel || "?"}</span> としてログインしています
                    </div>
                    <div className="text-[11px] text-zinc-500 leading-tight">
                        再履修や休学等で入学年度がずれている場合は
                        <a href="mailto:test.oyakudachi@gmail.com" className="underline font-bold text-primary mx-1">test.oyakudachi@gmail.com</a>
                        までご連絡ください。
                    </div>
                </div>
            )}
        </header>
    );
}
