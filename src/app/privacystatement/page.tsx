import Link from "next/link";

export default function PrivacyStatement() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-white rounded-[2.5rem] shadow-soft border border-zinc-100 p-8 md:p-12">
                <h1 className="text-3xl font-black text-foreground mb-8 text-center">プライバシーポリシー</h1>

                <div className="space-y-8 text-zinc-600 leading-relaxed">
                    <p>
                        「テストお役立ちくん」（以下「本サービス」）は、ユーザーのプライバシー保護を最優先に考え、個人情報の取り扱いに最大限の注意を払います。
                    </p>

                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-secondary-light rounded-full"></span>
                            1. 収集する情報
                        </h2>
                        <p>
                            本サービスでは、以下の情報を収集・取得します。
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-2">
                            <li><strong>メールアドレス:</strong> 提供されたアカウント情報</li>
                            <li><strong>ユーザーID:</strong> メールアドレスのユーザー名部分</li>
                            <li><strong>利用ログ:</strong> 初回ログイン日時および最終ログイン日時</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-secondary-light rounded-full"></span>
                            2. 利用目的
                        </h2>
                        <p>
                            取得した情報は、以下の目的のためにのみ利用します。
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-2">
                            <li>ログイン認証および利用資格（学年等）の判定。</li>
                            <li>本サービスの利用状況の把握。</li>
                            <li>不正アクセスの防止およびセキュリティの維持。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-secondary-light rounded-full"></span>
                            3. 外部サービスとの連携
                        </h2>
                        <p>
                            本サービスは、以下の外部プラットフォームを利用しています。
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-2">
                            <li><strong>Microsoft Entra ID (Microsoft 365):</strong> ユーザー認証のために利用します。パスワードは Microsoft 側で管理され、本サービスが取得することはありません。</li>
                            <li><strong>Google API</strong> ユーザーの利用状況を管理・保存するために利用します。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-secondary-light rounded-full"></span>
                            4. 情報の管理
                        </h2>
                        <p>
                            収集した情報は、適切に管理されたクラウド上に保存されます。これらのデータは、運営者および承認された管理者以外がアクセスすることはありません。法令に基づく場合を除き、第三者に提供されることもありません。
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col items-center gap-6">
                    <p>問い合わせ: test.oyakudachi@gmail.com</p>
                    <p className="text-sm font-bold text-zinc-400">最終更新：2026年3月10日</p>
                </div>
            </div>
        </div>
    );
}
