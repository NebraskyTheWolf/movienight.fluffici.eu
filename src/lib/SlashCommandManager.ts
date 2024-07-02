"use server"

import { SlashCommand, ApplicationCommandOption, Message } from './types';

class SlashCommandManager {
    private commands: Map<string, SlashCommand>;

    constructor() {
        this.commands = new Map();
    }

    registerCommand(command: SlashCommand) {
        if (this.commands.has(command.name)) {
            throw new Error(`Command "${command.name}" is already registered.`);
        }
        this.commands.set(command.name, command);
    }

    unregisterCommand(commandName: string) {
        if (!this.commands.has(commandName)) {
            throw new Error(`Command "${commandName}" is not registered.`);
        }
        this.commands.delete(commandName);
    }

    executeCommand(input: string): Message {
        const args = input.split(' ');
        const commandName = args.shift();

        if (!commandName || !this.commands.has(commandName)) {
            return { content: `Command "${commandName}" not found.`, ephemeral: true };
        }

        const command = this.commands.get(commandName)!;
        const parsedArgs = this.parseArgs(args, command.options);
        return command.execute(parsedArgs);
    }

    parseArgs(args: string[], options?: ApplicationCommandOption[]): any {
        const parsedArgs: any = {};
        options?.forEach((option, index) => {
            switch (option.type) {
                case 'STRING':
                    parsedArgs[option.name] = args[index];
                    break;
                case 'INTEGER':
                    parsedArgs[option.name] = parseInt(args[index], 10);
                    break;
                case 'NUMBER':
                    parsedArgs[option.name] = parseFloat(args[index]);
                    break;
                case 'BOOLEAN':
                    parsedArgs[option.name] = args[index] === 'true';
                    break;
                default:
                    parsedArgs[option.name] = args[index];
                    break;
            }
        });
        return parsedArgs;
    }

    listCommands() {
        return Array.from(this.commands.values()).map(command => ({
            name: command.name,
            description: command.description,
            options: command.options || [],
            permissions: command.permissions || 0
        }));
    }

    findCommand(query: string) {
        return this.listCommands().filter(command =>
            command.name.startsWith(query)
        );
    }

    getCommand(query: string): SlashCommand {
        let commands = Array.from(this.commands.values()).filter(command =>
            command.name.startsWith(query)
        );

        if (commands.length > 0) {
            return commands[0];
        } else {
            throw new Error('Command not found');
        }
    }

    hasCommand(query: string) {
        return this.commands.has(query)
    }
}

export default SlashCommandManager;
