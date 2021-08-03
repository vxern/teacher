import { GuildMember, Message, TextChannel } from "discord.js";

import { Client } from "../../../client/client";

import { Moderation } from "../moderation";
import { Command } from "../../command";
import { Utils } from "../../../utils";

export class Ban extends Command<Moderation> {
  readonly identifier = 'ban';
  readonly aliases = ['suspend'];
  readonly description = 'Bans a user indefinitely';
  readonly arguments = ['tag | name | id', 'optional: days', 'optional: reason'];
  readonly dependencies = [];
  readonly handler = this.ban;

  async ban(message: Message) {
    const args = message.content.split(' ');

    if (args.length > 1 && !Utils.isNumber(args[1])) {
      Client.warn(message.channel as TextChannel, 'The __number__ of days must be a __number__.');
      return;
    }

    message.content = args[0];

    const member = await this.module.resolve('GuildMember', message) as GuildMember | undefined;

    if (member === undefined) {
      return;
    }

    if (!member.bannable) {
      Client.warn(message.channel as TextChannel, 'You do not have the authority to ban this member.');
      return;
    }

    member?.ban({days: Number(args[1]), reason: args[2]});

    Client.severe(message.channel as TextChannel, `${member.user.tag} has been banned indefinitely.`);
  }
}