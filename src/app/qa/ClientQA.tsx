"use client";

import { useState, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

export default function ClientQA({ initialQuestions }: { initialQuestions: any[] }) {
    const [qs, setQs] = useState(initialQuestions);
    const [query, setQuery] = useState("");
    const [newQ, setNewQ] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [visibleCount, setVisibleCount] = useState(10); // Infinite scroll mock

    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL || "";

    const filteredQs = useMemo(() => {
        if (!query) return qs;
        const lower = query.toLowerCase();
        return qs.filter(q =>
            q.question.toLowerCase().includes(lower) ||
            q.answer.toLowerCase().includes(lower)
        );
    }, [qs, query]);

    const visibleQs = filteredQs.slice(0, visibleCount);

    // Intersection observer for infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
                if (visibleCount < filteredQs.length) {
                    setVisibleCount(prev => Math.min(prev + 10, filteredQs.length));
                }
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [visibleCount, filteredQs.length]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQ.trim()) return;
        setIsSubmitting(true);

        try {
            if (gasUrl) {
                await fetch(gasUrl, {
                    method: "POST",
                    body: JSON.stringify({ action: "submit_question", question: newQ }),
                    headers: { "Content-Type": "text/plain" }, // GAS CORS workaround
                    mode: "no-cors"
                });
            }
            alert("質問を送信しました！");
            setNewQ("");
            // Add optimistically (will lack ID but fine for visual feedback until refresh)
            setQs([{ id: "new", question: newQ, answer: "" }, ...qs]);
        } catch (err) {
            alert("送信に失敗しました。");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full">
            <section className="bg-white p-6 rounded-2xl shadow-soft border border-primary-light">
                <h2 className="text-lg font-bold text-foreground mb-4">質問を送る (匿名)</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <textarea
                        value={newQ}
                        onChange={e => setNewQ(e.target.value)}
                        placeholder="ここに質問を入力..."
                        className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl resize-none h-32 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        required
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !newQ.trim()}
                        className="self-end px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-soft hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? "送信中..." : "送信する"}
                    </button>
                </form>
            </section>

            <section className="flex flex-col gap-4">
                <div className="flex justify-between items-end mb-2">
                    <h2 className="text-lg font-bold text-foreground">過去の質問</h2>
                    <input
                        type="text"
                        placeholder="検索..."
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setVisibleCount(10); // reset visible count on search
                        }}
                        className="px-4 py-2 border border-zinc-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                <div className="flex flex-col gap-4 w-full">
                    {visibleQs.length === 0 ? (
                        <p className="text-zinc-500 text-center py-8">質問が見つかりません</p>
                    ) : (
                        visibleQs.map((q, i) => (
                            <div key={q.id || `new-${i}`} className="bg-white p-6 rounded-2xl shadow-soft border border-primary-light flex flex-col gap-4 transition-all hover:shadow-hover">
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-bold text-primary bg-primary-light/30 w-fit px-2 py-1 rounded-md">Q.</span>
                                    <p className="text-foreground whitespace-pre-wrap">{q.question}</p>
                                </div>
                                <div className="h-px w-full bg-primary-light" />
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-bold text-accent bg-accent-light/50 w-fit px-2 py-1 rounded-md">A.</span>
                                    {q.answer ? (
                                        <div className="text-foreground [&>p]:my-1 [&_a]:text-primary hover:[&_a]:text-pop [&_a]:font-bold [&_a]:underline [&_a]:transition-colors whitespace-pre-wrap">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                {q.answer}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-zinc-400 italic text-sm">まだ回答されていません</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
