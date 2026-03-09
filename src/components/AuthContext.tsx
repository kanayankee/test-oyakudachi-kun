"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";

interface AuthContextType {
    session: any;
    user: any;
    userId: string | null;
    admissionYear: number | null;
    calculatedGrade: string | null;
    gradeLabel: string | null;
    isD021: boolean;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const adminParam = searchParams.get("admin");
    const [manualAdmissionYear, setManualAdmissionYear] = useState<number | null>(null);
    const isLoading = status === "loading";

    useEffect(() => {
        if (status === "authenticated" && session?.user?.email) {
            const user = session.user;
            const email = user.email!;
            const savedManualYear = typeof window !== "undefined" ? sessionStorage.getItem("manual_admission_year") : null;
            if (savedManualYear) setManualAdmissionYear(parseInt(savedManualYear, 10));

            const userId = email.split("@")[0];
            let calcAdmissionYear: number | null = null;
            if (userId.startsWith('d') && userId.length >= 4) {
                const code = parseInt(userId.substring(1, 4), 10);
                if (!isNaN(code)) calcAdmissionYear = 2003 + code;
            }

            // Sync with Google Sheets via Internal API
            fetch("/api/auth/record-user", {
                method: "POST",
                body: JSON.stringify({
                    email: user.email,
                    uid: userId, // Use email prefix as unique ID for sheet
                    admissionYear: calcAdmissionYear
                })
            })
                .then(res => res.json())
                .then(json => {
                    if (json.success && json.manualAdmissionYear) {
                        setManualAdmissionYear(parseInt(json.manualAdmissionYear, 10));
                        if (typeof window !== "undefined") {
                            sessionStorage.setItem("manual_admission_year", json.manualAdmissionYear.toString());
                        }
                    }
                })
                .catch(e => console.error("Failed to record user:", e));
        } else if (status === "unauthenticated") {
            setManualAdmissionYear(null);
            if (typeof window !== "undefined") {
                sessionStorage.removeItem("manual_admission_year");
            }
        }
    }, [session, status]);

    const signOut = async () => {
        await nextAuthSignOut({ callbackUrl: "/kakomon/login" });
        setManualAdmissionYear(null);
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("manual_admission_year");
        }
    };

    const user = session?.user ?? (adminParam ? { email: `${adminParam}@example.com`, name: "Admin Test" } : null);
    const userId = adminParam ? adminParam : (user?.email ? user.email.split("@")[0] : null);
    const isD021 = userId ? userId.startsWith("d021") : false;

    // Calculate effective admission year: priority to manualAdmissionYear
    let finalAdmissionYear: number | null = manualAdmissionYear;
    if (!finalAdmissionYear && userId && userId.startsWith('d') && userId.length >= 4) {
        const code = parseInt(userId.substring(1, 4), 10);
        if (!isNaN(code)) {
            finalAdmissionYear = 2003 + code;
        }
    }

    // Calculate Grade
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const sy = now.getFullYear() - (month < 4 ? 1 : 0);

    // Admission Year (Entry Year) Logic:
    // d018 -> 2021 entry, d021 -> 2024 entry
    // Grade = School Year - Entry Year + 1
    const calculatedGrade = finalAdmissionYear ? (sy - finalAdmissionYear + 1).toString() : null;

    // myGrade Label Logic
    const isMyGradePeriod = (month === 3) || (month === 4 && day <= 20);
    let gradeLabel: string | null = null;
    if (calculatedGrade) {
        if (isMyGradePeriod) {
            const displayN = month === 3 ? parseInt(calculatedGrade, 10) + 1 : calculatedGrade;
            gradeLabel = `新${displayN}年生`;
        } else {
            gradeLabel = `${calculatedGrade}年生`;
        }
    }

    return (
        <AuthContext.Provider value={{
            session,
            user,
            userId,
            admissionYear: finalAdmissionYear,
            calculatedGrade,
            gradeLabel,
            isD021,
            isLoading,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
