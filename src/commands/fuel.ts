import type { Command, CommandInteraction } from "./";
import type { Env } from "@/env";
import {
    type APIApplicationCommandInteractionDataStringOption as APICommandInteractionStringOption,
    type APIApplicationCommandInteractionDataIntegerOption as APICommandInteractionIntegerOption,
    type APIChatInputApplicationCommandInteraction as APIChatInputInteraction,
    type APIInteractionResponse,
    ApplicationCommandOptionType,
    InteractionResponseType,
    InteractionType,
    MessageFlags,
} from "discord-api-types/payloads/v10";
import { searchStation } from "@/api";

const fuel: Command = {
    name: "fuel",
    description: "Zkontroluje ceny pohonných hmot v okolí.",
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: "location",
            description: "Místo hledání.",
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Integer,
            name: "station",
            description: "Číslo čerpací stanice.",
            required: true,
            autocomplete: true,
        },
    ],
    handler: async (interaction: CommandInteraction, _env: Env): Promise<APIInteractionResponse> => {
        const loc = (interaction as APIChatInputInteraction).data.options![0] as APICommandInteractionStringOption;

        const stations = await searchStation(loc.value);
        if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
            return {
                type: InteractionResponseType.ApplicationCommandAutocompleteResult,
                data: {
                    choices: stations.map((s, i) => ({
                        name: `${[s.name, s.street, s.city].filter(Boolean).join(", ")} ${s.postalCode}`,
                        value: i,
                    })),
                },
            };
        }

        const stationOpt = (interaction as APIChatInputInteraction).data
            .options![1] as APICommandInteractionIntegerOption;

        const stationId = stationOpt.value;
        if (stationId < 0 || stationId >= stations.length) {
            return {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content: `:x: Stanice s číslem \`${stationId}\` neexistuje.`,
                    flags: MessageFlags.Ephemeral,
                },
            };
        }

        const station = stations[stationId];
        return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                embeds: [
                    {
                        title: "Ceny pohonných hmot",
                        fields: station.fuels
                            .filter((f) => f.price !== "-" && f.lastUpdated)
                            .map((f) => ({
                                name: f.name,
                                value: f.price,
                                inline: true,
                            })),
                        footer: {
                            text: `${[station.name, station.street, station.city].filter(Boolean).join(", ")} ${station.postalCode}`,
                        },
                        color: 0x979c9f, // dark gray
                    },
                ],
            },
        };
    },
};

export default fuel;
