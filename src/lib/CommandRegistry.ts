"use server"

import SlashCommandManager from "@/lib/SlashCommandManager.ts";
import {addPermissions} from "@/lib/permission.ts";
import axios from "axios";

const commands = [
    {
        name: 'help',
        description: 'Get help about the commands!',
    },
    {
        name: 'about',
        description: 'Information about the platform.',
    },
];

const generateCommandFields = () => {
    return commands.map(command => ({
        name: `/${command.name}`,
        value: command.description,
        inline: false,
    }));
};

export default function registerCommands(slashCommandManager: SlashCommandManager) {
    slashCommandManager.registerCommand({
        name: 'help',
        description: 'Get help about the commands!',
        execute: async (args) => {
            return {
                embeds: [
                    {
                        author: {
                            name: 'FluffBOT - Help',
                            url: 'https://fluffici.eu',
                            icon_url: 'https://autumn.fluffici.eu/attachments/6-42Z7Tt7OqGTD_8H5S5UmG3Yry6mB7HHX5UxXazgp'
                        },
                        color: 'FF6B6B',
                        description: `Welcome to FluffBOT! Here are the available commands:`,
                        fields: generateCommandFields(),
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

    slashCommandManager.registerCommand({
        name: 'about',
        description: 'Information about the platform',
        execute: async (args) => {
            const response = await axios.get('https://blackmesa.fluffici.eu/embed?url=https://status.fluffici.eu')

            return {
                embeds: [
                    {
                        author: {
                            name: 'MovieNight - About',
                            url: 'https://fluffici.eu',
                            icon_url: 'https://autumn.fluffici.eu/attachments/6-42Z7Tt7OqGTD_8H5S5UmG3Yry6mB7HHX5UxXazgp'
                        },
                        color: 'FF6B6B',
                        title: 'Welcome to MovieNight!',
                        description: `This platform was made for Fluffici, z.s. with ♥️. Here you can find information about the platform, its development, and the team behind it.`,
                        fields: [
                            {
                                name: 'Author',
                                value: '[Vakea](mailto:vakea@fluffici.eu)',
                                inline: true
                            },
                            {
                                name: 'Version',
                                value: '1.0.0',
                                inline: true
                            },
                            {
                                name: 'Website',
                                value: '[Visit Fluffici](https://fluffici.eu)',
                                inline: true
                            },
                            {
                                name: 'Source Code',
                                value: '[GitHub Repository](https://github.com/Fluffici)',
                                inline: true
                            },
                            {
                                name: 'Support',
                                value: 'For support, contact us at [administrace@fluffici.eu](mailto:administrace@fluffici.eu)',
                                inline: false
                            },
                            {
                                name: 'Join our Community',
                                value: '[Discord Server](https://discord.gg/Fluffici)',
                                inline: false
                            }
                        ],
                        timestamp: new Date().toISOString(),
                        image: {
                            url: response.data.image.url
                        },
                        footer: {
                            text: 'Copyright (c) Fluffici, z.s. All Rights Reserved',
                            icon_url: 'https://cdn.discordapp.com/app-icons/1090193884782526525/1aed19e69224aeb09df782a3285e5e6a.png'
                        }
                    },
                ],
                ephemeral: false,
            };
        },
        permissions: addPermissions()
    });

    slashCommandManager.registerCommand({
        name: 'test',
        description: 'Test command with options',
        execute: async (args) => {
            return {
                embeds: [],
                ephemeral: false,
            };
        },
        permissions: addPermissions(),
        options: [
            {
                name: 'enabled',
                description: 'Is enabled?',
                type: 'BOOLEAN',
                required: true
            }
        ]
    });
}
