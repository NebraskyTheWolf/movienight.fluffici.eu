"use server"

import SlashCommandManager from "@/lib/SlashCommandManager.ts";
import {addPermissions} from "@/lib/permission.ts";

export default function registerCommands(slashCommandManager: SlashCommandManager) {
    slashCommandManager.registerCommand({
        name: 'help',
        description: 'Get help about the commands!',
        execute: (args) => {
            return {
                embeds: [
                    {
                        author: {
                            name: 'FluffBOT - Help',
                            url: 'https://fluffici.eu',
                            icon_url: 'https://autumn.fluffici.eu/attachments/6-42Z7Tt7OqGTD_8H5S5UmG3Yry6mB7HHX5UxXazgp'
                        },
                        color: '',
                        description: `### Markdown test
                        * OwO
                        * OwO 2
                        * OwO 3
                        `,
                        fields: [
                            {
                                name: 'Viewers',
                                value: '0',
                                inline: false
                            }
                        ],
                        timestamp: new Date().toISOString()
                    },
                ],
                ephemeral: false,
            };
        },
        permissions: addPermissions()
    });
}
