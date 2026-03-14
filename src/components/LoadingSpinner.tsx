export default function LoadingSpinner({ size = "large" }: { size?: "small" | "medium" | "large" }) {
    const sizeMap = {
        small: { img: "w-8 h-8", container: "h-8 w-8" },
        medium: "w-20 h-20",
        large: "w-64 h-64",
    };

    if (size === "small" || size === "medium") {
        const imgSize = size === "small" ? "w-8 h-8" : "w-20 h-20";
        return (
            <img
                src="/loading.svg"
                alt="読み込み中"
                className={imgSize}
            />
        );
    }

    return (
        <img
            src="/loading.svg"
            alt="読み込み中"
            className="w-64 h-64"
        />
    );
}
