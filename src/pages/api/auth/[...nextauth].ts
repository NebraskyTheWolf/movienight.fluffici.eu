import NextAuth, {NextAuthOptions} from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import connectToDatabase from "@/lib/mongodb.ts";
import Profile from "@/models/Profile.ts";
import {addPermission, addPermissions} from "@/lib/permission.ts";
import {CHAT_PERMISSION, USER_FLAGS} from "@/lib/constants.ts";

export const authOptions: NextAuthOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: 'identify email'
                }
            }
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (account && user) {
                token.accessToken = account.access_token;
                token.user = user;

                await connectToDatabase();
                const profile = await Profile.findOne({ discordId: user.id });
                if (profile) {
                    token.profile = profile
                } else {
                    const newUser = new Profile({
                        discordId: user.id,
                        permissions: addPermissions(
                            CHAT_PERMISSION.SEND_GIF,
                            CHAT_PERMISSION.SEND_LINKS,
                            CHAT_PERMISSION.SEND_EMOJIS,
                            CHAT_PERMISSION.SEND_MESSAGE,
                            CHAT_PERMISSION.REPLY_MESSAGE,
                            CHAT_PERMISSION.USE_COMMAND,
                            CHAT_PERMISSION.JOIN_PRESENCE,
                            CHAT_PERMISSION.READ_MESSAGE_HISTORY
                        ),
                        flags: USER_FLAGS.VIEWER,
                    })

                    token.profile = await newUser.save();
                }
            }

            return token;
        },

        async session({ session, token }: { session: any, token: any }) {
            session.user = token.user;
            session.accessToken = token.accessToken;
            session.guilds = token.guilds;
            session.profile = token.profile;
            return session;
        },
    }
};

export default NextAuth(authOptions)
