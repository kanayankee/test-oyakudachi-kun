export const dynamic = 'force-dynamic';

import { getSpreadsheetData } from "@/lib/sheets";
import ClientKakomonView from "./ClientKakomonView";

export default async function KakomonPage({
    params,
    searchParams
}: {
    params: Promise<{ grade: string }>;
    searchParams: Promise<{ myGrade?: string }>;
}) {
    const { grade } = await params;
    const { myGrade } = await searchParams;

    // Check if within the bypass period (March 1st - April 20th)
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const isBypassPeriod = (month === 3) || (month === 4 && day <= 20);
    const isMyGradeBypass = myGrade === "true" && isBypassPeriod;

    const data = await getSpreadsheetData();

    if (!data) return <div>Data not found</div>;

    const { teachers, files, settings } = data;

    // Filter for the requested grade
    const gradeTeachers = teachers.filter(row => row[0] === grade);
    const gradeFiles = files.filter(row => row[0] === grade);
    const gradeSettings = settings.filter(row => row[0] === grade);

    const testCols = gradeSettings.map(s => ({
        id: s[1],
        name: s[2],
        releaseDate: s[3]
    })).sort((a, b) => Number(a.id) - Number(b.id));

    const types = ["問題", "解答"];

    let prevCat = "";
    let prevName = "";

    const rawRows = gradeTeachers.map(tRow => {
        const [, subjectCat, subjectName, subjectAbbr, teacherName, comment] = tRow;

        const cellData: Record<string, any[]> = {};
        testCols.forEach(tc => {
            types.forEach(ty => {
                cellData[`${tc.id}_${ty}`] = [];
            });
        });

        const tFiles = gradeFiles.filter(fRow => fRow[3] === teacherName || (fRow[3] === "共通" && fRow[5].includes(subjectAbbr)));

        tFiles.forEach(f => {
            const year = f[1];
            const testId = f[2];
            const type = f[4];
            const fname = f[5];
            const fid = f[6];

            if (cellData[`${testId}_${type}`]) {
                const testInfo = testCols.find(tc => tc.id === testId) || { name: "", releaseDate: "2099/12/31" };
                const isLocked = !isMyGradeBypass && new Date(testInfo.releaseDate) > new Date();

                cellData[`${testId}_${type}`].push({
                    year: `20${year}年度`,
                    fileName: fname,
                    fileId: fid,
                    isLocked,
                    isVerified: f[7] === "TRUE" || f[7] === true,
                    releaseDate: testInfo.releaseDate
                });
            }
        });

        return {
            subjectCat,
            subjectName,
            subjectAbbr,
            teacherName,
            comment,
            cellData,
            rowSpanCat: 1,
            rowSpanName: 1
        };
    });

    for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (row.subjectCat !== prevCat) {
            let span = 1;
            for (let j = i + 1; j < rawRows.length; j++) {
                if (rawRows[j].subjectCat === row.subjectCat) span++;
                else break;
            }
            row.rowSpanCat = span;
            prevCat = row.subjectCat;
        } else {
            row.rowSpanCat = 0;
        }

        if (row.subjectName !== prevName || row.rowSpanCat > 0) {
            let span = 1;
            for (let j = i + 1; j < rawRows.length; j++) {
                if (rawRows[j].subjectName === row.subjectName && rawRows[j].subjectCat === row.subjectCat) span++;
                else break;
            }
            row.rowSpanName = span;
            prevName = row.subjectName;
        } else {
            row.rowSpanName = 0;
        }
    }

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-foreground mb-6">{grade}年生 過去問データベース</h1>
            <ClientKakomonView rows={rawRows} testCols={testCols} grade={grade} />
        </div>
    );
}
