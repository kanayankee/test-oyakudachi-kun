export default function PrivacyStatement() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-white rounded-[2.5rem] shadow-soft border border-zinc-100 p-8 md:p-12">
                <h1 className="text-3xl font-black text-foreground mb-8 text-center">プライバシーポリシー</h1>

                <div className="space-y-8 text-zinc-600 leading-relaxed">
                    <p>
                        「テストお役立ちくん」（以下「本サービス」）は、利用者のプライバシー保護を重視し、取得する情報を必要最小限に限定したうえで適切に取り扱います。
                    </p>

                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-secondary-light rounded-full"></span>
                            1. 収集する情報
                        </h2>
                        <p>
                            本サービスでは、以下の情報を取得する場合があります。
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-2">
                            <li><strong>ログイン情報:</strong> メールアドレス、ユーザーID（メールアドレスの@前部分）、初回ログイン日時、最終ログイン日時、入学年度情報（自動判定値および管理者による手動設定値）</li>
                            <li><strong>認証関連情報:</strong> OTP（ワンタイムコード）利用に必要な一時情報、パスキー（WebAuthn）に関する公開鍵・カウンタ等の認証情報</li>
                            <li><strong>投稿・アップロード情報:</strong> 質問箱の投稿内容、過去問アップロード時のメタデータ（学年、科目、教員名、年度、テスト名、種別、ファイル識別子等）</li>
                            <li><strong>学籍番号:</strong> 過去問アップロードの運用管理のため、アップロード情報とあわせて記録される場合があります</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-secondary-light rounded-full"></span>
                            2. 利用目的
                        </h2>
                        <p>
                            取得した情報は、以下の目的で利用します。
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-2">
                            <li>本人認証（OTP・パスキー）およびログイン管理のため</li>
                            <li>学年判定、利用権限制御、機能提供のため</li>
                            <li>過去問アップロード運用、質問対応、管理者確認のため</li>
                            <li>不正利用防止、障害対応、セキュリティ維持のため</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-secondary-light rounded-full"></span>
                            3. 外部サービスとの連携
                        </h2>
                        <p>
                            本サービスは運営のために外部サービスを利用しています。
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-2">
                            <li><strong>Google Firebase（Authentication/Firestore）:</strong> 認証および認証関連データ管理に利用します。</li>
                            <li><strong>Google Sheets / Google Apps Script:</strong> 利用者情報、質問、過去問運用情報の保存・処理に利用します。</li>
                            <li><strong>Gmail / Google Apps Script:</strong> OTPメール配信および運用通知に利用します。</li>
                            <li><strong>Vercel:</strong> 本サービスの配信基盤として利用します。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-secondary-light rounded-full"></span>
                            4. 第三者提供・安全管理
                        </h2>
                        <p>
                            取得した情報は、アクセス権限管理のもとで運営者および必要な管理担当者のみが取り扱います。法令に基づく場合を除き、本人の同意なく第三者へ提供しません。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-zinc-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-secondary-light rounded-full"></span>
                            5. 保有期間・見直し
                        </h2>
                        <p>
                            情報の保有期間は、運用上必要な期間および法令上必要な期間の範囲で定めます。本ポリシーは、機能追加や法令改正等に応じて見直し・改定されることがあります。
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col items-center gap-6">
                    <p>問い合わせ: test.oyakudachi@gmail.com</p>
                    <p className="text-sm font-bold text-zinc-400">最終更新：2026年3月15日</p>
                </div>
            </div>
        </div>
    );
}
