import { NextResponse } from "next/server";
import { recordUserInSheets } from "@/lib/sheets";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, uid, admissionYear } = body;

        if (!email || !uid) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const result = await recordUserInSheets(email, uid, admissionYear);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("API Auth Record Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
