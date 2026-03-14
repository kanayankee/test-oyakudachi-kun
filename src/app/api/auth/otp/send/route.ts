import { NextResponse } from "next/server";
import { getOrCreateOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "メールアドレスが必要です" }, { status: 400 });
    }

    // only allow doshisha-js.ed.jp pattern and starting with d + 6 digits
    const prefix = email.split("@")[0];
    const domain = email.split("@")[1];
    if (domain !== "doshisha-js.ed.jp" || !/^d\d{6}$/.test(prefix)) {
      return NextResponse.json({ success: false, error: "不正なメールアドレス形式です" }, { status: 400 });
    }

    const code = await getOrCreateOtp(email);
    await sendOtpEmail(email, code);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("send-otp error", err);
    return NextResponse.json({ success: false, error: err.message || "内部エラー" }, { status: 500 });
  }
}
