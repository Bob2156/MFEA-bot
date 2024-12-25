const { InteractionType, InteractionResponseType, verifyKey } = require("discord-interactions");
const fetch = require("node-fetch");
const rawBody = require("raw-body");

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const APPLICATION_ID = process.env.APPLICATION_ID;
const GUILD_ID = process.env.GUILD_ID;
const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

// Define commands
const commands = [
  {
    name: "check",
    description: "Checks if the bot is online.",
  },
];

// Function to register commands
async function registerCommands() {
  try {
    console.log("Registering slash commands...");
    const response = await fetch(
      `https://discord.com/api/v10/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bot ${DISCORD_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commands),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to register commands: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Slash commands registered:", data);
  } catch (error) {
    console.error("Error registering commands:", error);
  }
}

module.exports = async (req, res) => {
  // Only respond to POST requests
  if (req.method === "POST") {
    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];
    const rawBodyContent = await rawBody(req);

    // Verify request
    const isValidRequest = verifyKey(rawBodyContent, signature, timestamp, PUBLIC_KEY);
    if (!isValidRequest) {
      console.error("Invalid request signature");
      return res.status(401).send({ error: "Invalid request signature" });
    }

    // Parse the request body
    const interaction = JSON.parse(rawBodyContent);

    // Handle PING type from Discord
    if (interaction.type === InteractionType.PING) {
      console.log("Received PING");
      return res.send({ type: InteractionResponseType.PONG });
    }

    // Handle APPLICATION_COMMAND type
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      if (interaction.data.name === "check") {
        console.log("Handling /check command");
        return res.send({
          type: 4,
          data: {
            content: "Bot is online and working!",
          },
        });
      }
    }

    // Default for unknown types
    console.error("Unknown interaction type:", interaction.type);
    return res.status(400).send({ error: "Unknown interaction type" });
  }

  // Register commands on GET requests (useful for deployment)
  if (req.method === "GET") {
    await registerCommands();
    return res.status(200).send("Commands registered!");
  }

  // Return 404 for unsupported methods
  res.status(404).send("Not Found");
};
