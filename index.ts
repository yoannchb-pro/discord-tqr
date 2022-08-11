"use strict";

import { Browser, Page } from "puppeteer";

const puppeteer = require("puppeteer");
const got = require("got");
const randomUseragent = require("random-useragent");

export type DiscordQRCodeTokenHandlerConfig = {
  loginUrl: string;
  discordUserApi: string;
  discordSubscriptionApi: string;
  httpHeader: any;
};

export class DiscordQRCodeTokenHandler {
  private $browser: Browser = null;
  private $page: Page = null;

  public qr: string = null;
  public user: any = null;

  public config: DiscordQRCodeTokenHandlerConfig = {
    loginUrl: "https://discord.com/login",
    discordUserApi: "https://discord.com/api/v9/users/@me",
    discordSubscriptionApi:
      "https://discordapp.com/api/v9/users/@me/billing/subscriptions",
    httpHeader: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "user-agent": randomUseragent.getRandom(),
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "fr-FR,fr;q=0.9,fr;q=0.8",
    },
  };

  constructor(public token?: string) {}

  /**
   * Create a login QR Code
   * @param options
   * @returns
   */
  async getQRCode(
    options: { path?: string; browserOptions?: any; encoding?: string } = {}
  ) {
    if (this.$browser || this.$page) await this.closeConnection();

    this.$browser = await puppeteer.launch(
      options?.browserOptions ? options.browserOptions : { headless: true }
    );
    this.$page = (await this.$browser.pages())[0];

    const page = this.$page;

    await page.setViewport({
      width: 1920,
      height: 1080,
    });

    await page.setExtraHTTPHeaders(this.config.httpHeader);

    await page.goto(this.config.loginUrl, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("canvas");

    const canvas = await page.$("canvas");
    const parentCanvas = await canvas!.getProperty("parentNode");
    const qrC = await parentCanvas.getProperty("parentNode");

    const data = await (qrC as any).screenshot({
      ...(options.path ? { path: options.path } : {}),
      ...(options.encoding ? { path: options.encoding } : {}),
    });

    this.qr = data.toString();

    return data;
  }

  /**
   * Listen for token and return it when the program get it
   * @returns
   */
  async listenForToken(): Promise<string> {
    if (!this.$browser || !this.$page)
      throw new Error("This method need to be launch after 'getQRCode' method");

    const page = this.$page;

    await page.waitForNavigation({ timeout: 60000 });

    const token = await page.evaluate(() => {
      window.dispatchEvent(new Event("beforeunload"));

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      const localStorage = (iframe as any).contentWindow.localStorage;
      return JSON.parse(localStorage.token);
    });

    this.token = token;

    return token;
  }

  /**
   * Return informations about the user account from the discord api like email, phone, name...
   * @param token
   * @returns
   */
  async getDiscordAccountInfo(token?: string) {
    token = token ?? this.token;

    if (!token) throw new Error("Invalide token");

    const scrapInfo = await got(this.config.discordUserApi, {
      headers: { Authorization: token },
    });
    const info = JSON.parse(scrapInfo.body);

    const scrapSub = await got(this.config.discordSubscriptionApi, {
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

  /**
   * Open the discord account in puppeter and return the browser and page corresponding
   * @param options
   * @returns
   */
  async openDiscordAccount(
    options: { token?: string; browserOptions?: any } = {}
  ): Promise<[Browser, Page]> {
    const token = options?.token ?? this.token;

    if (!token) throw new Error("Invalide token");

    const browser = await puppeteer.launch(
      options?.browserOptions
        ? options.browserOptions
        : {
            headless: false,
            defaultViewport: null,
            args: ["--start-fullscreen"],
          }
    );

    const page = (await browser.pages())[0];

    await page.goto(this.config.loginUrl, {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate((token: string) => {
      setInterval(() => {
        (
          document.body.appendChild(document.createElement("iframe")) as any
        ).contentWindow.localStorage.token = `"${token}"`;
      }, 50);
      setTimeout(() => {
        location.reload();
      }, 2500);
    }, token);

    return [browser, page];
  }

  /**
   * Close the opened browser used to generate QR Code and to listen the token
   */
  async closeConnection() {
    if (this.$browser) {
      const browser = this.$browser;
      await browser.close();
      this.$browser = null;
      this.$page = null;
    }
  }
}

module.exports = DiscordQRCodeTokenHandler;
