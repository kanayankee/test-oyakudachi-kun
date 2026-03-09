"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export default function ClientHomeRedirect() {
    const { isD021, calculatedGrade, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isD021 && calculatedGrade) {
            router.replace(`/kakomon/${calculatedGrade}`);
        }
    }, [isD021, calculatedGrade, isLoading, router]);

    return null;
}
