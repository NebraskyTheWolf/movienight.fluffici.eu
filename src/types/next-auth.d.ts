import {Bitfield} from "@/lib/utils.ts";
import {Sanction} from "@/models/Profile.ts";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            image: string;
        };
        accessToken: string;
        guilds: Array<{
            id: string;
            name: string;
            icon: string;
            permissions: number;
        }>;
        profile: {
            discordId: string;
            permissions: Bitfield;
            flags: Bitfield;
            sanction: Sanction;
        };
    }

    interface JWT {
        accessToken: string;
        user: {
            id: string;
            name: string;
            email: string;
            image: string;
        };
        profile: {
            discordId: string;
            permissions: Bitfield;
            flags: Bitfield;
            sanction: Sanction;
        };
        guilds: Array<{
            id: string;
            name: string;
            icon: string;
            permissions: number;
        }>;
    }
}
