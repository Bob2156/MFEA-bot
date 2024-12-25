const { verifyKey } = require("discord-interactions");

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];
    const rawBody = JSON.stringify(req.body);

    // Verify the request
    const isValidRequest = verifyKey(
      rawBody,
      signature,
      timestamp,
      process.env.DISCORD_PUBLIC_KEY
    );

    if (!isValidRequest) {
      return res.status(401).send("Invalid request signature");
    }

    const { type, data } = req.body;

    // Respond to Discord's PING
    if (type === 1) {
      return res.status(200).json({ type: 1 });
    }

    // Respond to /check command
    if (type === 2 && data.name === "check") {
      return res.status(200).json({
        type: 4,
        data: {
          content: "Working!",
        },
      });
    }

    return res.status(400).send("Unknown request type");
  }

  return res.status(404).send("Not Found");
};
