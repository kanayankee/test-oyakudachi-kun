import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

function getDriveClient() {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) {
        throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
    }

    const credentials = JSON.parse(credentialsJson);

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    return google.drive({ version: "v3", auth });
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const fileId = searchParams.get("fileId");

        if (!fileId || !/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
            return new NextResponse("Invalid fileId", { status: 400 });
        }

        const drive = getDriveClient();

        const fileMetaStatus = await drive.files.get({
            fileId,
            fields: "mimeType, name",
        });

        const mimeType = fileMetaStatus.data.mimeType || "application/octet-stream";
        const fileName = fileMetaStatus.data.name || "download";

        const response = await drive.files.get(
            { fileId, alt: "media" },
            { responseType: "stream" }
        );

        const headers = new Headers();
        headers.set("Content-Type", mimeType);
        headers.set("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`);
        headers.set("Cache-Control", "private, max-age=3600");
        headers.set("Set-Cookie", "viewed=true; Secure; SameSite=Strict; Path=/");

        // Convert ReadStream to Web ReadableStream
        const readableStream = new ReadableStream({
            start(controller) {
                response.data.on("data", (chunk: Buffer) => controller.enqueue(chunk));
                response.data.on("end", () => controller.close());
                response.data.on("error", (err: Error) => controller.error(err));
            },
        });

        return new NextResponse(readableStream as any, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("Drive API Error:", error);
        return new NextResponse("Error fetching file", { status: 500 });
    }
}

export async function HEAD(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const fileId = searchParams.get("fileId");

        if (!fileId || !/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
            return new NextResponse("Invalid fileId", { status: 400 });
        }

        const drive = getDriveClient();

        const fileMetaStatus = await drive.files.get({
            fileId,
            fields: "mimeType, name",
        });

        const mimeType = fileMetaStatus.data.mimeType || "application/octet-stream";

        const headers = new Headers();
        headers.set("Content-Type", mimeType);

        return new NextResponse(null, { status: 200, headers });
    } catch (error) {
        return new NextResponse(null, { status: 500 });
    }
}
