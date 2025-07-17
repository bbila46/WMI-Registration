const { Client, GatewayIntentBits, Partials, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, SlashCommandBuilder } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');
const keepAlive = require('./keepalive.js');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel]
});

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'wmi_register') {
    const modal = new ModalBuilder()
      .setCustomId('register_modal')
      .setTitle('WMI Registration');

    const nameInput = new TextInputBuilder()
      .setCustomId('name')
      .setLabel("Your Full Name")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const emailInput = new TextInputBuilder()
      .setCustomId('email')
      .setLabel("Your Email (optional)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const row1 = new ActionRowBuilder().addComponents(nameInput);
    const row2 = new ActionRowBuilder().addComponents(emailInput);
    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === 'register_modal') {
    const name = interaction.fields.getTextInputValue('name');
    const email = interaction.fields.getTextInputValue('email') || 'Not Provided';

    const embed = new EmbedBuilder()
      .setTitle('Choose Your Role')
      .setDescription(`Please select your academic role.`)
      .setColor(0x4B9CD3);

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`select_ms1`)
        .setLabel('MS1 - Year 1 Student')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [button], ephemeral: true });

    // Store for later use
    client.registrationCache = {
      [interaction.user.id]: { name, email }
    };
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'select_ms1') {
      const studentRoleId = '1392653369964757154';
      const inviteLink = 'https://discord.gg/66qx29Tf';
      const logChannelId = '1392655742430871754';
      const targetServerId = '1387102987238768783';
      const user = interaction.user;

      // Join message
      await interaction.reply({
        content: `🎓 Click the link to join the Wisteria Medical Institute server:\n${inviteLink}\nOnce joined, you’ll automatically receive your student role.`,
        ephemeral: true
      });

      // Auto-role assignment is possible only *after* the user joins
      client.once(Events.GuildMemberAdd, async member => {
        if (member.guild.id === targetServerId && member.id === user.id) {
          const role = member.guild.roles.cache.get(studentRoleId);
          if (role) await member.roles.add(role);

          // Welcome Message
          const welcomeChannel = member.guild.systemChannel || member.guild.channels.cache.find(ch => ch.type === 0);
          if (welcomeChannel) {
            const welcomeEmbed = new EmbedBuilder()
              .setTitle(`🎉 Welcome to Wisteria Medical Institute!`)
              .setDescription(`Greetings, <@${member.id}>!\n\nWe’re thrilled to welcome you to **Wisteria Medical Institute** — where knowledge meets compassion.\n\nThank you for choosing us as your academic home. Here, you'll grow, learn, and shape the future of medicine with a supportive and passionate community.\n\n💡 If you need help or have any questions, don’t hesitate to ask!\n\nWishing you success on your medical journey!`)
              .setColor(0x58A6FF)
              .setFooter({ text: "WMI Bot" });

            welcomeChannel.send({ embeds: [welcomeEmbed], files: ['https://www.dropbox.com/scl/fi/m7e8xa674tc6fp8jbdhv0/Video-Jul-13-2025-00-28-27.mp4?rlkey=gshrknyj3pes86l9wfzdcui4x&st=zoiyxrl3&dl=1'] });
          }

          // Log registration
          const logChannel = member.guild.channels.cache.get(logChannelId);
          if (logChannel && client.registrationCache[member.id]) {
            const reg = client.registrationCache[member.id];
            const logEmbed = new EmbedBuilder()
              .setTitle('📋 New Registration')
              .addFields(
                { name: 'Name', value: reg.name },
                { name: 'Email', value: reg.email },
                { name: 'Date', value: new Date().toLocaleString() },
                { name: 'Role', value: 'MS1 - Year 1 Student' }
              )
              .setColor(0x4CAF50);
            logChannel.send({ embeds: [logEmbed] });
          }
        }
      });
    }
  }
});

client.login(token);
