const { InteractionResponseType, InteractionType, verifyKey } = require("discord-interactions");
const getRawBody = require("raw-body");

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    return response.status(405).send("Method Not Allowed");
  }

  const signature = request.headers["x-signature-ed25519"];
  const timestamp = request.headers["x-signature-timestamp"];
  const rawBody = await getRawBody(request);

  const isValidRequest = verifyKey(
    rawBody,
    signature,
    timestamp,
    process.env.PUBLIC_KEY
  );

  if (!isValidRequest) {
    return response.status(401).send({ error: "Bad request signature" });
  }

  const message = JSON.parse(rawBody);

  if (message.type === InteractionType.PING) {
    return response.send({ type: InteractionResponseType.PONG });
  }

  if (message.type === InteractionType.APPLICATION_COMMAND) {
    if (message.data.name === "check") {
      return response.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: "Bot is online!" },
      });
    }
  }

  return response.status(400).send({ error: "Unknown Type" });
};
