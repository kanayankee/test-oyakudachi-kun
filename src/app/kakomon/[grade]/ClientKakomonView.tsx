"use client";

import React, { useState } from "react";

function TeacherAccordion({
    row,
    testCols,
    grade,
    onUploadClick,
    onFileClick,
    onCommentClick,
}: {
    row: any;
    testCols: any[];
    grade: string;
    onUploadClick: (abbr: string, teacher: string, testId?: string, type?: string) => void;
    onFileClick: (e: React.MouseEvent, file: any) => void;
    onCommentClick: (comment: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const isTeacherAddition = row.teacherName?.includes("追加") ?? false;

    const teacherLabel = isTeacherAddition ? (
        <button
            onClick={() => onUploadClick(row.subjectAbbr, "追加")}
            className="text-primary font-bold hover:underline"
        >
            {row.teacherName}
        </button>
    ) : (
        <span>
            {(row.teacherName ?? "").split("\n").map((line: string, i: number) => (
                <span key={i} className="block">{line}</span>
            ))}
        </span>
    );

    return (
        <div className="border border-zinc-200 rounded-xl overflow-hidden">
            <button
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${open ? "bg-primary-light/70" : "bg-zinc-50 hover:bg-primary-light/40"}`}
                onClick={() => !isTeacherAddition && setOpen(!open)}
            >
                <span className="text-sm font-bold text-foreground">{teacherLabel}</span>
                {!isTeacherAddition && (
                    <span className="text-zinc-400 text-sm shrink-0">{open ? "▲" : "▼"}</span>
                )}
            </button>

            {open && (
                <div className="p-4 bg-white flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-150">
                    {row.comment && (
                        <p className="text-xs text-zinc-500 whitespace-pre-wrap bg-zinc-50 rounded-lg px-3 py-2 border border-zinc-200">
                            💬 {row.comment}
                        </p>
                    )}
                    {testCols.map((tc) => {
                        const qFiles = row.cellData[`${tc.id}_問題`] || [];
                        const aFiles = row.cellData[`${tc.id}_解答`] || [];
                        return (
                            <div key={tc.id} className="rounded-xl border border-primary-light/60 overflow-hidden">
                                <div className="bg-primary-light/30 px-3 py-2 text-xs font-bold text-foreground border-b border-primary-light/60">
                                    {tc.name}
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-zinc-100">
                                    {(["問題", "解答"] as const).map((type) => {
                                        const files = type === "問題" ? qFiles : aFiles;
                                        const typeColor = type === "問題"
                                            ? "bg-primary-light/20 text-primary border-primary hover:bg-primary hover:text-white"
                                            : "bg-pop-light/30 text-accent border-accent hover:bg-accent hover:text-white";
                                        return (
                                            <div key={type} className="p-3 flex flex-col gap-2">
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">{type}</span>
                                                {files.map((file: any, j: number) => (
                                                    <button
                                                        key={j}
                                                        onClick={(e) => onFileClick(e, file)}
                                                        className={`w-full text-xs font-bold px-2 py-1.5 rounded-lg border transition-all ${file.isLocked
                                                            ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                                                            : typeColor
                                                            }`}
                                                    >
                                                        {file.year}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => onUploadClick(row.subjectAbbr, row.teacherName.replace(/\n/g, " "), tc.id, type)}
                                                    className="w-full text-[10px] font-bold px-2 py-1 bg-zinc-50 text-zinc-400 rounded-md border border-dashed border-zinc-200 hover:bg-primary-light hover:text-primary transition-colors"
                                                >
                                                    + アップロード
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function ClientKakomonView({ rows, testCols, grade }: { rows: any[]; testCols: any[]; grade: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalUrl, setModalUrl] = useState("");
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [commentData, setCommentData] = useState("");

    const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
    const [addTeacherTarget, setAddTeacherTarget] = useState<{ cat: string; name: string; abbr: string } | null>(null);
    const [addTeacherName, setAddTeacherName] = useState("");
    const [addTeacherYear, setAddTeacherYear] = useState("");
    const [addTeacherStatus, setAddTeacherStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
    const [addTeacherError, setAddTeacherError] = useState("");

    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL || "https://script.google.com/macros/s/dummy/exec";

    const handleUploadClick = (subjectAbbr: string, teacherName: string, testId = "", type = "") => {
        const url = `${gasUrl}?grade=${grade}&subject=${subjectAbbr}&teacher=${encodeURIComponent(teacherName)}&testId=${testId}&type=${type}`;
        setModalUrl(url);
        setIframeLoaded(false);
        setIsModalOpen(true);
    };

    const handleFileClick = (e: React.MouseEvent, file: any) => {
        if (file.isLocked) {
            e.preventDefault();
            alert(`この過去問は公開前です。公開予定日: ${file.releaseDate}`);
        } else if (!file.isVerified) {
            e.preventDefault();
            alert("この過去問はデータチェックが完了していません。しばらくお待ちください。");
        } else {
            window.open(`/kakomon/view/?fileId=${file.fileId}`, "_blank");
        }
    };

    const openAddTeacher = (cat: string, name: string, abbr: string) => {
        setAddTeacherTarget({ cat, name, abbr });
        setAddTeacherName("");
        setAddTeacherYear("");
        setAddTeacherStatus("idle");
        setAddTeacherError("");
        setIsAddTeacherOpen(true);
    };

    const submitAddTeacher = async () => {
        if (!addTeacherTarget || !addTeacherName.trim() || !addTeacherYear) return;
        setAddTeacherStatus("loading");
        try {
            const res = await fetch(gasUrl, {
                method: "POST",
                body: JSON.stringify({
                    action: "add_teacher",
                    grade,
                    subjectCat: addTeacherTarget.cat,
                    subjectName: addTeacherTarget.name,
                    subjectAbbr: addTeacherTarget.abbr,
                    teacherName: addTeacherName.trim(),
                    nendo: addTeacherYear,
                }),
            });
            const json = await res.json();
            if (json.status === "success") {
                setAddTeacherStatus("ok");
            } else {
                setAddTeacherStatus("error");
                setAddTeacherError(json.message || "エラーが発生しました");
            }
        } catch (e: any) {
            setAddTeacherStatus("error");
            setAddTeacherError(e.message);
        }
    };

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: currentYear - 2009 }, (_, i) => currentYear - i);

    const grouped: { cat: string; subjects: { name: string; abbr: string; teachers: any[] }[] }[] = [];
    rows.forEach((row) => {
        let catGroup = grouped.find((g) => g.cat === row.subjectCat);
        if (!catGroup) {
            catGroup = { cat: row.subjectCat, subjects: [] };
            grouped.push(catGroup);
        }
        let subGroup = catGroup.subjects.find((s) => s.name === row.subjectName);
        if (!subGroup) {
            subGroup = { name: row.subjectName, abbr: row.subjectAbbr, teachers: [] };
            catGroup.subjects.push(subGroup);
        }
        subGroup.teachers.push(row);
    });

    return (
        <div className="flex flex-col gap-8">
            <div className="bg-primary-light/60 border border-primary/20 rounded-2xl p-4 text-sm text-foreground leading-relaxed">
                コメント掲載希望・ファイルの間違いなどは
                <a href="/qa" className="text-primary font-bold underline mx-1">質問箱</a>
                または
                <a href="https://lin.ee/U8JWjpnT" target="_blank" className="text-[#06C755] font-bold underline mx-1">公式LINE</a>
                でお知らせください。
            </div>
            {grouped.map((catGroup) => (
                <section key={catGroup.cat}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-1.5 h-7 bg-primary rounded-full" />
                        <h2 className="text-xl font-black text-foreground">{catGroup.cat}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {catGroup.subjects.map((subject) => (
                            <div
                                key={subject.name}
                                className="bg-white rounded-2xl border border-primary-light shadow-soft overflow-hidden flex flex-col"
                            >
                                <div className="bg-primary-light/40 px-4 py-3 border-b border-primary-light">
                                    <h3 className="text-base font-black text-foreground">{subject.name}</h3>
                                </div>
                                <div className="flex flex-col gap-2 p-3 flex-1">
                                    {subject.teachers.map((row, i) => (
                                        <TeacherAccordion
                                            key={i}
                                            row={row}
                                            testCols={testCols}
                                            grade={grade}
                                            onUploadClick={handleUploadClick}
                                            onFileClick={handleFileClick}
                                            onCommentClick={(c) => { setCommentData(c); setIsCommentModalOpen(true); }}
                                        />
                                    ))}
                                </div>
                                <div className="px-3 pb-3">
                                    <button
                                        onClick={() => openAddTeacher(catGroup.cat, subject.name, subject.abbr)}
                                        className="w-full text-xs font-bold py-2 rounded-xl border border-dashed border-success/40 text-success bg-success-light/40 hover:bg-success/10 transition-colors"
                                    >
                                        ＋ 教員を追加
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            {isAddTeacherOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsAddTeacherOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-primary-light bg-zinc-50">
                            <h3 className="font-bold text-foreground">教員を追加</h3>
                            <button onClick={() => setIsAddTeacherOpen(false)} className="text-zinc-400 hover:text-foreground p-1">&#x2715;</button>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            <div className="text-xs text-zinc-500 bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                                <span className="font-bold text-foreground">科目：</span>{addTeacherTarget?.name}
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-foreground">教員名（苗字のみ）</label>
                                <textarea
                                    value={addTeacherName}
                                    onChange={e => setAddTeacherName(e.target.value)}
                                    placeholder={"例: 山田\n複数の場合は改行で区切る"}
                                    rows={3}
                                    className="border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none resize-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-foreground">年度</label>
                                <select
                                    value={addTeacherYear}
                                    onChange={e => setAddTeacherYear(e.target.value)}
                                    className="border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none bg-white"
                                >
                                    <option value="">選択してください</option>
                                    {yearOptions.map(y => (
                                        <option key={y} value={y.toString()}>{y}年度</option>
                                    ))}
                                </select>
                            </div>
                            {addTeacherStatus === "error" && (
                                <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{addTeacherError}</p>
                            )}
                            {addTeacherStatus === "ok" ? (
                                <div className="text-center py-2">
                                    <p className="text-success font-bold text-sm">✅ 追加しました！ページをリロードしてください。</p>
                                </div>
                            ) : (
                                <button
                                    onClick={submitAddTeacher}
                                    disabled={addTeacherStatus === "loading" || !addTeacherName.trim()}
                                    className="w-full font-black py-3 rounded-2xl bg-success text-white hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {addTeacherStatus === "loading" ? "送信中..." : "追加する"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isCommentModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsCommentModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-primary-light bg-zinc-50">
                            <h3 className="font-bold text-foreground">教員コメント</h3>
                            <button onClick={() => setIsCommentModalOpen(false)} className="text-zinc-400 hover:text-foreground p-1">&#x2715;</button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-foreground whitespace-pre-wrap">{commentData}</p>
                        </div>
                        <div className="p-4 border-t border-primary-light bg-zinc-50 text-center">
                            <button onClick={() => setIsCommentModalOpen(false)} className="font-bold text-sm bg-primary text-white px-6 py-2 rounded-xl shadow-sm hover:bg-primary/90 transition-colors">閉じる</button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-primary-light bg-zinc-50">
                            <h3 className="font-bold text-foreground">過去問アップロード</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-foreground p-1">&#x2715;</button>
                        </div>
                        <div className="flex-1 w-full bg-zinc-100 relative">
                            {!iframeLoaded && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-50">
                                    <img src="/loading.svg" alt="読み込み中" className="w-20 h-20" />
                                    {/* <p className="text-sm font-bold text-foreground">フォームを読み込み中...</p> */}
                                </div>
                            )}
                            <iframe
                                src={modalUrl}
                                className={`w-full h-full border-0 transition-opacity duration-300 ${iframeLoaded ? "opacity-100" : "opacity-0"}`}
                                title="Upload Form"
                                onLoad={() => setIframeLoaded(true)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

