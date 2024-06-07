import type { Env } from "@/env";
import type {
    APIApplicationCommand,
    APIApplicationCommandInteraction,
    APIApplicationCommandAutocompleteInteraction,
    APIInteractionResponse,
} from "discord-api-types/payloads/v10";
import fuel from "./fuel";

export type CommandInteraction = APIApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction;
export type CommandHandler = (interaction: CommandInteraction, env: Env) => Promise<APIInteractionResponse>;

export interface Command extends Partial<APIApplicationCommand> {
    handler: CommandHandler;
}

export const COMMANDS: Command[] = [fuel];

const commands = new Map(COMMANDS.map((cmd) => [cmd.name!.toLowerCase(), cmd]));
export const findHandler = (name: string): CommandHandler | null => {
    const cmd = commands.get(name.toLowerCase());
    if (!cmd) {
        return null;
    }

    return cmd.handler;
};
