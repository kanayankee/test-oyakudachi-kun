"use client";

import React, { useCallback, useEffect, useRef } from "react";

interface Props {
    length: number;
    value: string;
    onChange: (numeric: string) => void;
    disabled?: boolean;
    autoFocus?: boolean;
    className?: string;
    autoComplete?: string;
}

export default function MultiDigitInput({ length, value, onChange, disabled, autoFocus, className, autoComplete = "off" }: Props) {
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const normalizeDigits = (raw: string) => {
        return raw
            .replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
            .replace(/[^0-9]/g, "");
    };

    // when value prop changes externally, update individual boxes
    useEffect(() => {
        // nothing here; each box reads from value
    }, [value]);

    const focusIndex = (idx: number) => {
        const inp = inputsRef.current[idx];
        if (inp && !disabled) inp.focus();
    };

    const applyDigitsFromIndex = (digits: string, idx: number) => {
        const current = Array.from({ length }, (_, i) => value[i] || "");
        for (let i = 0; i < digits.length && idx + i < length; i++) {
            current[idx + i] = digits[i];
        }
        onChange(current.join(""));
        const nextIdx = Math.min(idx + digits.length, length - 1);
        focusIndex(nextIdx);
    };

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
            const key = e.key;
            const target = e.currentTarget;
            if (key === "Backspace") {
                e.preventDefault();
                const newVal = value.slice(0, idx) + " " + value.slice(idx + 1);
                onChange(newVal.replace(/ /g, ""));
                if (target.value === "" && idx > 0) {
                    focusIndex(idx - 1);
                } else {
                    target.value = "";
                }
            } else if (key === "ArrowLeft") {
                if (idx > 0) focusIndex(idx - 1);
            } else if (key === "ArrowRight") {
                if (idx + 1 < length) focusIndex(idx + 1);
            }
        },
        [length, value, onChange]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        if ((e.nativeEvent as any)?.isComposing) {
            return;
        }
        const ch = normalizeDigits(e.target.value);
        if (!ch) {
            // cleared
            const newVal = value.slice(0, idx) + " " + value.slice(idx + 1);
            onChange(newVal.replace(/ /g, ""));
        } else {
            applyDigitsFromIndex(ch, idx);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const paste = normalizeDigits(e.clipboardData.getData("text"));
        if (!paste) return;
        const digits = paste.slice(0, length);
        onChange(digits);
        const nextIdx = Math.min(digits.length, length - 1);
        focusIndex(nextIdx);
    };

    return (
        <div className={`flex gap-1.5 sm:gap-2 max-w-full ${className || ""}`}>
            {Array.from({ length }).map((_, idx) => (
                <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[idx] || ""}
                    onChange={(e) => handleChange(e, idx)}
                    onCompositionEnd={(e) => {
                        const ch = normalizeDigits(e.currentTarget.value);
                        if (!ch) return;
                        applyDigitsFromIndex(ch, idx);
                    }}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={handlePaste}
                    ref={(el) => { inputsRef.current[idx] = el; }}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="w-[clamp(2.25rem,11vw,4rem)] h-[clamp(2.75rem,11vw,4rem)] text-center text-[clamp(1.125rem,4.6vw,1.5rem)] border border-zinc-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    autoFocus={autoFocus && idx === 0}
                />
            ))}
        </div>
    );
}
