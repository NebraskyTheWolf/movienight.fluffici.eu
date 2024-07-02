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
                        color: 'FF6B6B',
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
                        timestamp: new Date().toISOString(),
                        image: {
                            url: 'https://status.fluffici.eu/assets/status_pages/og_operational-b02e3c30367784b0fc6f0ad9a8278409c336107a0eab28aa64f0f55458d91567.png'
                        },
                        footer: {
                            text: 'FluffBOT',
                            icon_url: 'https://cdn.discordapp.com/app-icons/1090193884782526525/1aed19e69224aeb09df782a3285e5e6a.png'
                        }
                    },
                ],
                ephemeral: false,
            };
        },
        permissions: addPermissions()
    });
}
