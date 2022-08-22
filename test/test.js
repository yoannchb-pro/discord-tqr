const path = require("path");

const DiscordTQR = require("../dist").default;
(async function () {
  try {
    const handler = new DiscordTQR();

    console.log("Creating qr code...");
    await handler.getQRCode({
      path: path.resolve(__dirname, "../assets/qr-with-template.png"),
      browserOptions: { headless: false },
      template: "default",
    });
    console.log("QR code created !");

    console.log("Waiting for token...");
    await handler.listenForToken();
    console.log("Token: ", handler.token);

    // console.log("Opening user account...");
    // const [browser, page] = await handler.openDiscordAccount();

    console.log("Getting user informations...");
    await handler.getDiscordAccountInfo();
    console.log("User information:", handler.user);

    // setTimeout(async () => {
    //   console.log("Closing opened browser...");
    //   await browser.close();
    // }, 20000);

    console.log("Closing connection...");
    await handler.closeConnection();
  } catch (e) {
    console.log(e);
  }
})();
