export const dynamic = 'force-dynamic';

import { getQAData } from "@/lib/sheets";
import ClientQA from "./ClientQA";

export default async function QAPage() {
    const rows = await getQAData();

    // Parse rows
    // format: [No, 質問, 回答]
    const questions = rows.map((row: any) => ({
        id: row[0] || "",
        question: row[1] || "",
        answer: row[2] || "",
    })).filter((q: any) => q.question); // Filter out empty

    // sort descending by ID assuming ID is a number
    questions.sort((a: any, b: any) => Number(b.id) - Math.abs(Number(a.id)));

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-3xl">
                <h1 className="text-2xl font-bold text-foreground mb-6">質問箱</h1>
                <ClientQA initialQuestions={questions} />
            </div>
        </div>
    );
}
