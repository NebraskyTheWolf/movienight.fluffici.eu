"use client"

import {useSession} from "next-auth/react";
import {hasPermission} from "@/lib/utils.ts";
import {CHAT_PERMISSION} from "@/lib/constants.ts";
import React from "react";
import DashboardScreen from "@/components/moderation.tsx";
import {useRouter} from "next/navigation";


const AccessGate: React.FC =  () => {
    const { data: session } = useSession()

    if (!session) {
        return null;
    } else if (!hasPermission(session?.profile, CHAT_PERMISSION.MODERATION_DASHBOARD)) {
        return (
            <div className={""}>

            </div>
        );
    }

    return (
        <div>
            <DashboardScreen />
        </div>
    );
}

export default AccessGate
