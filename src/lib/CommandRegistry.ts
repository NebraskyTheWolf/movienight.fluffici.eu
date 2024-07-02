import SlashCommandManager from "@/lib/SlashCommandManager.ts";

export default function registerCommands(slashCommandManager: SlashCommandManager) {
    slashCommandManager.registerCommand({
        name: 'test',
        description: 'Says hello',
        execute: (args) => {
            return {
                content: `Result:`,
                embeds: [
                    {
                        color: 65280,
                        title: 'Test OwO',
                        description: `Hehehe this is a test :)`,
                        timestamp: new Date().toISOString(),
                    },
                ],
                ephemeral: true,
            };
        }
    });
}
