import { google } from "googleapis";

export const SPREADSHEET_ID = "17fSNC4IA6rFseTWjxlfDiHUHImoAETX9-w2VGaoZxow";

export async function getSpreadsheetData() {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) {
        throw new Error("Missing credentials");
    }

    const credentials = JSON.parse(credentialsJson);

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const [teachersRes, filesRes, settingsRes] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "教員一覧!A2:F" }),
        sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "過去問!A2:H" }),
        sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "過去問公開設定!A2:D" }),
    ]);

    return {
        teachers: teachersRes.data.values || [],
        files: filesRes.data.values || [],
        settings: settingsRes.data.values || [],
    };
}

export async function getQAData() {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) return [];
    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "質問箱!A2:C" });
    return res.data.values || [];
}

export async function getAnnouncementsData() {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) return [];
    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "お知らせ!A2:C" });
    return res.data.values || [];
}

export async function recordUserInSheets(email: string, uid: string, admissionYear: number | null) {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) throw new Error("Missing credentials");
    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const dateStr = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

    // Ensure sheet exists and get data
    let values: any[][] = [];
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "ユーザー!A:F",
        });
        values = res.data.values || [];
    } catch (e: any) {
        // Assume sheet exists or needs range update
    }

    if (values.length === 0) {
        // Initialize header
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: "ユーザー!A1:F1",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [["メール", "ユーザーID", "入学年度", "初回ログイン日時", "最終ログイン日時", "手動入学年度"]],
            },
        });
        values = [["メール", "ユーザーID", "入学年度", "初回ログイン日時", "最終ログイン日時", "手動入学年度"]];
    }

    let foundRowIndex = -1;
    let manualAdmissionYear: string | null = null;

    for (let i = 1; i < values.length; i++) {
        if (values[i][0] === email) {
            foundRowIndex = i;
            // Column F is 手動入学年度 (Manual Override)
            manualAdmissionYear = values[i][5] || null;
            break;
        }
    }

    if (foundRowIndex !== -1) {
        // Update last login (Column E is index 4)
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `ユーザー!E${foundRowIndex + 1}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[dateStr]],
            },
        });
    } else {
        // Append new row
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: "ユーザー!A:F",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[email, uid, admissionYear, dateStr, dateStr, ""]],
            },
        });
    }

    return { success: true, manualAdmissionYear };
}

export async function markPasskeyRegistered(email: string) {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) throw new Error("Missing credentials");
    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "ユーザー!A:A",
    });
    const values = res.data.values || [];

    const rowIndex = values.findIndex((row) => row[0] === email);
    if (rowIndex === -1) return;

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `ユーザー!H${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [["登録済"]],
        },
    });
}
