export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <img src="/loading.svg" alt="読み込み中" className="w-64 h-64" />
            {/* <p className="text-foreground font-bold text-4xl">読み込み中...</p> */}
        </div>
    );
}

