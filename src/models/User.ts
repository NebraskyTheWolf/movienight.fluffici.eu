import {Bitfield} from "@/lib/utils.ts";

class User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    avatar: number;
    avatar_id: string;
    created_at: string;
    updated_at: string;
    fcm_token: string;
    is_fcm: boolean;
    language: string;
    deleted_at: string | null;
    bio: string;
    pronouns: string;
    discord_linked: number;
    discord_id: string;
    username: string;
    permissions: Bitfield;
    flags: Bitfield;

    constructor(
        id: number,
        name: string,
        email: string,
        email_verified_at: string | null,
        avatar: number,
        avatar_id: string,
        created_at: string,
        updated_at: string,
        fcm_token: string,
        is_fcm: boolean,
        language: string,
        deleted_at: string | null,
        bio: string,
        pronouns: string,
        discord_linked: number,
        discord_id: string,
        username: string,
        permissions: Bitfield,
        flags: Bitfield
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.email_verified_at = email_verified_at;
        this.avatar = avatar;
        this.avatar_id = avatar_id;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.fcm_token = fcm_token;
        this.is_fcm = is_fcm;
        this.language = language;
        this.deleted_at = deleted_at;
        this.bio = bio;
        this.pronouns = pronouns;
        this.discord_linked = discord_linked;
        this.discord_id = discord_id;
        this.username = username;
        this.permissions = permissions;
        this.flags = flags;
    }
}

export default User;
