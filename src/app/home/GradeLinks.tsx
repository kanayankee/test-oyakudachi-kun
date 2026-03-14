"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";

export default function GradeLinks({ grades }: { grades: { id: string; label: string }[] }) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleClick = (gradeId: string) => {
        if (loadingId) return;
        setLoadingId(gradeId);
        // use router.push so we can manage state around navigation
        router.push(`/kakomon/${gradeId}`);
    };

    return (
        <div className="flex flex-col gap-3">
            {grades.map((grade) => (
                <button
                    key={grade.id}
                    onClick={() => handleClick(grade.id)}
                    disabled={!!loadingId}
                    className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all border border-primary-light group text-foreground text-left disabled:opacity-50 disabled:cursor-wait"
                >
                    <div className="w-12 h-12 rounded-full bg-primary-light group-hover:bg-pop-light flex items-center justify-center transition-colors shadow-sm shrink-0">
                        {loadingId === grade.id ? (
                            <Loading />
                        ) : (
                            <span className="text-xl font-bold text-primary group-hover:text-amber-600 transition-colors">
                                {grade.id}
                            </span>
                        )}
                    </div>
                    <span className="text-lg font-bold text-foreground">
                        {grade.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
