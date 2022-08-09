const DiscordQRCodeTokenHandler = require("../index");

(async function () {
  try {
    const handler = new DiscordQRCodeTokenHandler();

    console.log("Creating qr code...");
    await handler.getQRCode({ path: "qr.png" });
    console.log("QR code created !");

    console.log("Waiting for token...");
    await handler.listenForToken();
    console.log("Token: ", handler.token);

    console.log("Getting user informations...");
    await handler.getDiscordAccountInfo();
    console.log("User information:", handler.user);

    console.log("Opening user account...");
    handler.openDiscordAccount();

    setTimeout(async () => await handler.closeOpenedBrowserConnection(), 20000);

    await handler.closeConnection();
  } catch (e) {
    console.log(e);
  }
})();
