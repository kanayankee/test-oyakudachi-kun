export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white opacity-100">
            <img src="/loading.svg" alt="読み込み中" className="w-64 h-64" />
            {/* <p className="text-foreground font-bold text-4xl">読み込み中...</p> */}
        </div>
    );
}

