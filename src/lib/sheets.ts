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
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
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
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
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
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "お知らせ!A2:C" });
    return res.data.values || [];
}
