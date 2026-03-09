export const dynamic = 'force-dynamic';

import Link from "next/link";
import { getAnnouncementsData } from "@/lib/sheets";
import ClientAnnouncement from "./ClientAnnouncement";
import ClientHomeRedirect from "./ClientHomeRedirect";

export default async function Home() {
  const grades = [
    { id: "1", label: "1年生用" },
    { id: "2", label: "2年生用" },
    { id: "3", label: "3年生用" },
  ];

  const [announcementsData] = await Promise.all([
    getAnnouncementsData(),
    new Promise(resolve => setTimeout(resolve, 1500))
  ]);
  const announcements = announcementsData.map(row => ({
    date: row[0],
    title: row[1],
    content: row[2]
  })).reverse(); // latest first

  return (
    <div className="w-full flex flex-col gap-10">
      <ClientHomeRedirect />
      {/* 趣旨・お知らせ Section */}
      <section className="bg-pop-light/60 border border-pop-light rounded-3xl p-6 sm:p-8 shadow-soft">
        <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
          <span className="text-3xl">📢</span> お知らせ
        </h2>

        <div className="flex flex-col gap-4">
          {announcements.map((ann, idx) => (
            <ClientAnnouncement key={idx} announcement={ann} />
          ))}
          {announcements.length === 0 && (
            <p className="text-zinc-500 text-sm">現在お知らせはありません。</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">質問箱</h2>
        <Link
          href="/qa"
          className="bg-primary-light hover:bg-primary/20 rounded-2xl shadow-soft p-8 flex flex-col items-center justify-center gap-3 transition-all border border-primary/20 group text-foreground text-center"
        >
          <span className="text-4xl group-hover:scale-110 transition-transform duration-300">📮</span>
          <span className="text-2xl font-bold">匿名で質問する・回答を見る</span>
          <span className="text-sm text-zinc-500">テスト以外の質問でも大丈夫です。むしろそっちの方が多いです。早い時は1分で返します。</span>
        </Link>
      </section>

      {/* 過去問リンク Section */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">過去問データベース</h2>
        <div className="flex flex-col gap-3">
          {grades.map((grade) => (
            <Link
              key={grade.id}
              href={`/kakomon/${grade.id}`}
              className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all border border-primary-light group"
            >
              <div className="w-12 h-12 rounded-full bg-primary-light group-hover:bg-pop-light flex items-center justify-center transition-colors shadow-sm shrink-0">
                <span className="text-xl font-bold text-primary group-hover:text-amber-600 transition-colors">
                  {grade.id}
                </span>
              </div>
              <span className="text-lg font-bold text-foreground">{grade.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* リンク Section */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">リンク集</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="https://lin.ee/U8JWjpnT"
            target="_blank"
            className="col-span-1 md:col-span-2 bg-[#06C755]/10 border border-[#06C755]/20 hover:bg-[#06C755]/20 rounded-2xl shadow-soft p-6 flex flex-col items-center justify-center gap-3 transition-colors group text-center"
          >
            <span className="text-xl font-bold text-[#06C755] group-hover:text-[#05B04A] transition-colors">お役立ちくん公式LINE<br />(新1･2年生専用)</span>
            <span className="text-sm text-zinc-600">過去問が公開されたらお知らせします！<br />質問箱で聞きにくいことはこちらへ</span>
          </Link>

          <Link
            href="https://quizlet.com/join/NGUvhYV5t?i=5s8ybg&x=1bqt"
            target="_blank"
            className="bg-white rounded-2xl shadow-soft p-5 flex flex-col items-center justify-center hover:shadow-hover hover:-translate-y-1 transition-all border border-primary-light group text-center"
          >
            <span className="text-xl font-bold text-indigo-500 mb-1">Quizlet</span>
            <span className="text-sm text-zinc-600">79期(2024入学)生が作ったQuizlet</span>
          </Link>

          <Link
            href="https://drive.google.com/file/d/1dhZ9cmIuS67gt8dJXJ7Q8lfat1KJyBpD/view?usp=sharing"
            target="_blank"
            className="bg-white rounded-2xl shadow-soft p-5 flex flex-col items-center justify-center hover:shadow-hover hover:-translate-y-1 transition-all border border-primary-light group text-center"
          >
            <span className="text-xl font-bold text-accent mb-1">欠席届</span>
            <span className="text-sm text-zinc-600">便利なリンク</span>
          </Link>

          <Link
            href="https://dshs-gpa.vercel.app/"
            target="_blank"
            className="bg-white rounded-2xl shadow-soft p-5 flex flex-col items-center justify-center hover:shadow-hover hover:-translate-y-1 transition-all border border-primary-light group text-center"
          >
            <span className="text-xl font-bold text-success mb-1">加重平均計算機</span>
            <span className="text-sm text-zinc-600">学内推薦に使う数値「加重平均」を計算するサイトです。<br />こんな機能欲しい！があれば質問箱へ！<br />進級基準を満たしているかも確認できます😭</span>
          </Link>

          <Link
            href="https://lin.ee/U8JWjpnT"
            target="_blank"
            className="bg-white rounded-2xl shadow-soft p-5 flex flex-col items-center justify-center hover:shadow-hover hover:-translate-y-1 transition-all border border-primary-light group text-center"
          >
            <span className="text-xl font-bold text-amber-600 mb-1">プリントお役立ちくん</span>
            <span className="text-sm text-zinc-600">2024年度の1年生の配布プリントをアーカイブしています。<br />公式LINEに登録すると見れます。</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
