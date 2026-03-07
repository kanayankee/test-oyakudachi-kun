"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

export default function ClientAnnouncement({ announcement }: { announcement: any }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col transition-colors hover:border-primary-light">
            <div
                className="flex flex-col cursor-pointer group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3">
                    <span className="text-sm font-bold text-white bg-primary px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">{announcement.date}</span>
                    <h3 className="text-lg font-extrabold text-foreground group-hover:text-primary transition-colors leading-tight">{announcement.title}</h3>
                </div>

                {!isOpen && (
                    <div className="text-center mt-3">
                        <span className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                            ＋ 詳細を見る
                        </span>
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="text-foreground [&>p]:my-2 [&_a]:text-primary hover:[&_a]:text-pop [&_a]:font-bold [&_a]:underline [&_a]:transition-colors [&_strong]:font-extrabold [&_h1]:text-2xl [&_h1]:font-black [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {announcement.content}
                        </ReactMarkdown>
                    </div>
                    <div className="text-center mt-2">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-sm font-bold text-zinc-500 hover:text-foreground transition-colors px-6 py-2 bg-zinc-100 rounded-full"
                        >
                            ー 閉じる
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
