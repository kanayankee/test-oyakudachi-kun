export async function sendOtpEmail(to: string, code: string) {
  const gasUrl = process.env.GAS_MAIL_WEBAPP_URL;
  const sharedSecret = process.env.GAS_MAIL_SHARED_SECRET;

  if (!gasUrl) {
    throw new Error("GAS_MAIL_WEBAPP_URL is not set");
  }

  if (!sharedSecret) {
    throw new Error("GAS_MAIL_SHARED_SECRET is not set");
  }

  const subject = `認証コード:${code}【テストお役立ちくん】`;
  const text = `テストお役立ちくんをご利用いただきありがとうございます。認証コードは以下の通りです。\n\n${code}\n\nこのコードを10分以内に入力してください。\nこのメールに心当たりがない場合はこのメールを破棄してください。\n\nテストお役立ちくん`;

  const response = await fetch(gasUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "send_otp",
      secret: sharedSecret,
      to,
      subject,
      text,
      from: process.env.MAIL_FROM || "",
      fromName: process.env.MAIL_FROM_NAME || "テストお役立ちくん",
      labelName: process.env.MAIL_LABEL_NAME || "テストお役立ちくん",
    }),
  });

  const responseText = await response.text();
  const summarizeGasResponse = (text: string) => {
    const titleMatch = text.match(/<title>(.*?)<\/title>/i);
    const bodyText = text
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const title = titleMatch?.[1]?.trim();
    const summary = bodyText.slice(0, 300);
    return [title, summary].filter(Boolean).join(" | ") || text.slice(0, 300);
  };

  if (!response.ok) {
    console.error("[gas-mail] non-200 response", {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
    });
    throw new Error(`GAS request failed: ${response.status} ${response.statusText} ${summarizeGasResponse(responseText)}`);
  }

  let result: any;
  try {
    result = JSON.parse(responseText);
  } catch {
    console.error("[gas-mail] non-json response", responseText);
    throw new Error(`GAS returned non-JSON response: ${summarizeGasResponse(responseText)}`);
  }

  if (!result || result.status !== "success") {
    throw new Error(result?.message || "GAS mail send failed");
  }
}
