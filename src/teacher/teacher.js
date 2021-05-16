import { Client as DiscordClient } from 'discord.js';

import { FaunaDatabase } from '../fauna/database.js';

// Teacher modules
import { ExtensionModule } from '../modules/extension/extension_module.js';
import { InformationModule } from '../modules/information/information_module.js';
import { MusicModule } from '../modules/music/music_module.js';
import { DefinitionModule } from '../modules/definition/definition_module.js';
import { RolesModule } from '../modules/roles/roles_module.js';

import { removeNonAlphanumeric } from '../language.js';

// Teacher config
import * as config from './teacher_config.js';
import { SocialModule } from '../modules/social/social_module.js';

const Database = new FaunaDatabase();
const Client = new DiscordClient();

export class TeacherClient {
    constructor() {
        // Set up at launch
        Client.on('ready', () => {
            Client.user.setPresence({
                activity: {
                    name: config.default.status,
                },
                status: 'online',
            });

            // Modules used by teacher
            this.teacherModules = [
                new ExtensionModule(),
                new InformationModule(Client),
                new MusicModule(),
                new DefinitionModule(),
                new RolesModule(),
                new SocialModule(Database),
            ];

            console.log(`Teacher is ready to serve with ${this.teacherModules.length} module/s.`);
        });

        Client.on('message', (message) => this.handleMessage(message));
        Client.on('userUpdate', (oldUser, newUser) => this.handleUserUpdate(oldUser, newUser));
        Client.on('guildMemberAdd', (member) => this.handleJoin(member));
        Client.on('guildMemberRemove', (member) => this.handleLeave(member));
        Client.on('guildBanAdd', (_, user) => this.handleBan(user));
        Client.on('guildBanRemove', (_, user) => this.handleUnban(user));
    }

    /// Authenticates the client using the Discord secret specified in environment variables
    async login() {
        await Client.login(process.env.DISCORD_SECRET);
    }

    async handleUserUpdate(oldUser, newUser) {
        // Iterate over modules to find the suitable user update handler
        this.teacherModules.forEach(async (teacherModule) => {
            try {
                await teacherModule.handleUserUpdate(oldUser, newUser);
            } catch {}
        });
    }

    /// Handles messages written to the server
    async handleMessage(message) {
        // Prevents the bot from responding to another bot
        if (message.author.bot) {
            return;
        }
        
        // Prevents the bot from responding to its own messages
        if (message.member.id === Client.user.id) {
            return;
        }

        // Prevents the bot from responding in an excluded channel
        if (config.default.excludedChannels.includes(removeNonAlphanumeric(message.channel.name))) {
            return;
        }

        // Convert the content of the message to lowercase, remove duplicate whitespaces
        message.content = message.content.toLowerCase().trim().replace(/ +/g, ' ');

        // If the message does not begin with the specified prefix
        if (!message.content.startsWith(config.default.prefix) && !config.default.unprefixedChannels.includes(message.channel.name)) {
            return;
        }

        // Remove the prefix from a string
        message.content = message.content.replace(config.default.prefix, '').trimLeft();

        // Iterate over modules to find the suitable message handler
        this.teacherModules.forEach(async (teacherModule) => {
            try {
                if (await teacherModule.handleMessage(message)) {
                    return;
                } 
            } catch {}
        });
    }

    async handleJoin(member) {
        // Iterate over modules to find the suitable join handler
        this.teacherModules.forEach(async (teacherModule) => {
            try {
                await teacherModule.handleJoin(member);
            } catch {}
        });
    }

    async handleLeave(member) {
        // Iterate over modules to find the suitable leave handler
        this.teacherModules.forEach(async (teacherModule) => {
            try {
                await teacherModule.handleLeave(member);
            } catch {}
        });
    }

    async handleBan(user) {
        // Iterate over modules to find the suitable ban handler
        this.teacherModules.forEach(async (teacherModule) => {
            try {
                await teacherModule.handleBan(user);
            } catch {}
        });
    }

    async handleUnban(user) {
        // Iterate over modules to find the suitable unban handler
        this.teacherModules.forEach(async (teacherModule) => {
            try {
                await teacherModule.handleUnban(user);
            } catch {}
        });
    }

    /// Sends an embed to the text channel specified
    static async sendEmbed(textChannel, {
        title = undefined,
        thumbnail = undefined,
        message = undefined,
        color = config.default.accentColorNormal,
        fields = undefined,
    }) {
        if (fields === undefined && message === undefined) {
            console.error('Refused to send embed: Neither fields nor a message have been supplied into the embed.');
            return;
        }
        
        textChannel.send({embed: {
            title: title,
            thumbnail: {
                url: thumbnail,
            },
            description: message,
            color: color,
            fields: fields,
        }});
    }

    /// Sends an embed with a warning message
    static async sendTip(textChannel, {message = undefined, fields = undefined}) {
        this.sendEmbed(textChannel, {
            message: message !== undefined ? `:bulb: ${message}` : message, 
            fields: fields, 
            color: config.default.accentColorTip
        });
    }

    /// Sends an embed with a warning message
    static async sendWarning(textChannel, {message = undefined, fields = undefined}) {
        this.sendEmbed(textChannel, {
            message: message !== undefined ? `:warning: ${message}` : message, 
            fields: fields, 
            color: config.default.accentColorWarning
        });
    }

    /// Sends an embed with an error message
    static async sendError(textChannel, {message = undefined, fields = undefined}) {
        this.sendEmbed(textChannel, {
            message: message !== undefined ? `:exclamation: ${message}` : message, 
            fields: fields, 
            color: config.default.accentColorError
        });
    }
}