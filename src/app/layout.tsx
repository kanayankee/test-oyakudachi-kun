import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

const genJyuu = localFont({
  src: [
    {
      path: "../../public/fonts/GenJyuuGothic-Normal.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/GenJyuuGothic-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-genjyuu",
});

export const metadata: Metadata = {
  title: "同志社高校 テストお役立ちくん",
  description: "過去問や質問箱が利用できるサービス",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${genJyuu.className} antialiased flex flex-col min-h-screen`}>
        <div className="flex-1 flex flex-col items-center w-full">
          <header className="w-full max-w-[1400px] px-4 md:px-8 py-4 flex justify-between items-center mt-4 bg-white/80 backdrop-blur-md rounded-xl shadow-soft sticky top-4 z-50">
            <Link href="/" className="flex items-center gap-3">
              <img src="/icon.png" alt="Logo" className="w-10 h-10 rounded-full" />
              <h1 className="text-xl font-bold text-foreground">同志社高校 テストお役立ちくん</h1>
            </Link>
          </header>
          <main className="flex-1 w-full max-w-[1400px] px-4 md:px-8 py-4 mt-6">
            {children}
          </main>
        </div>
        <footer className="w-full py-6 mt-12 border-t border-zinc-200 flex justify-center items-center bg-white/50 text-foreground text-sm">
          ©︎ 2026 テストお役立ちくん All rights reserved.
        </footer>
      </body>
    </html>
  );
}

