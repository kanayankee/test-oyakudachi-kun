"use client";

import Link from "next/link";

export default function TermsOfService() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-white rounded-[2.5rem] shadow-soft border border-zinc-100 p-8 md:p-12">
                <h1 className="text-3xl font-black text-foreground mb-8 text-center">利用規約</h1>

                <div className="space-y-8 text-zinc-600 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-primary rounded-full"></span>
                            第1条（目的）
                        </h2>
                        <p>
                            本規約は、「テストお役立ちくん」（以下「本サービス」）の利用条件を定めるものです。本サービスは、高校生が学習に役立てることを目的として運営されています。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-primary rounded-full"></span>
                            第2条（利用資格）
                        </h2>
                        <p>
                            本サービスの利用は、高校生に限定されます。ログインに際しては、メールアドレスまたはOAuthによる認証を必要とします。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-primary rounded-full"></span>
                            第3条（禁止事項）
                        </h2>
                        <p>
                            ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-2">
                            <li>本サービス内のコンテンツを第三者に譲渡、転送、または再配布する行為。</li>
                            <li>本サービス内のコンテンツを印刷し、不特定多数に配布する行為。</li>
                            <li>SNS、ウェブサイト、掲示板等にコンテンツを公開する行為。</li>
                            <li>その他、著作権を侵害し、または運営を妨害する一切の行為。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-primary rounded-full"></span>
                            第4条（免責事項）
                        </h2>
                        <p>
                            本サービスで提供される情報は、有志による提供に基づいており、正確性や完全性を保証するものではありません。本サービスを利用したことによる、試験結果やその他の損害について、運営者は一切の責任を負いません。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-primary rounded-full"></span>
                            第5条（規約の変更）
                        </h2>
                        <p>
                            本規約は、事前の通知なく変更される場合があります。利用者は随時本規約を確認し、最新の内容に同意した上で本サービスを利用するものとします。
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col items-center gap-6">
                    <p className="text-sm font-bold text-zinc-400">制定：2026年3月10日</p>
                </div>
            </div>
        </div>
    );
}
