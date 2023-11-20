"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jimg_1 = __importDefault(require("jimg"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
class DiscordTQR {
    constructor(token) {
        this.token = token;
        this.$browser = null;
        this.$page = null;
        this.qr = null;
        this.user = null;
        this.config = {
            loginUrl: "https://discord.com/login",
            discordUserApi: "https://discord.com/api/v10/users/@me",
            discordSubscriptionApi: "https://discordapp.com/api/v10/users/@me/billing/subscriptions",
            httpHeader: {
                accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
                "accept-encoding": "gzip, deflate, br",
                "accept-language": "fr-FR,fr;q=0.9,fr;q=0.8",
            },
        };
    }
    /**
     * Create a login QR Code
     * @param options
     * @returns
     */
    getQRCode(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof options.template === "string" && options.template !== "default")
                throw new Error("Invalide value for 'template'");
            if (this.$browser || this.$page)
                yield this.closeConnection();
            this.$browser = yield puppeteer_1.default.launch((options === null || options === void 0 ? void 0 : options.browserOptions)
                ? options.browserOptions
                : { headless: "new", defaultViewport: null });
            this.$page = (yield this.$browser.pages())[0];
            const page = this.$page;
            yield page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            });
            yield page.setExtraHTTPHeaders(this.config.httpHeader);
            yield page.goto(this.config.loginUrl, {
                waitUntil: "networkidle2",
            });
            yield page.waitForSelector('[class^="qrCodeOverlay"]');
            if (options === null || options === void 0 ? void 0 : options.wait)
                yield new Promise((r) => setTimeout(r, options.wait));
            const qrC = yield page.$('[class^="qrCodeOverlay"]');
            let data = yield qrC.screenshot(Object.assign(Object.assign(Object.assign({}, (options.path && !options.template ? { path: options.path } : {})), (options.encoding ? { path: options.encoding } : {})), { captureBeyondViewport: false }));
            let finalImageBase64 = data instanceof Buffer ? data.toString("base64") : data;
            //template
            if (options.template) {
                const tmpFile = path_1.default.resolve(__dirname, "./tmp.png");
                fs_1.default.writeFileSync(tmpFile, finalImageBase64, "base64");
                const optionsJimg = {
                    path: options.path,
                    images: [
                        {
                            path: options.template === "default"
                                ? path_1.default.resolve(__dirname, "../assets/template.png")
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
                            : Object.assign(Object.assign({}, options.template), { path: tmpFile }),
                    ],
                };
                finalImageBase64 = yield (0, jimg_1.default)(optionsJimg);
                fs_1.default.unlinkSync(tmpFile);
            }
            this.qr = finalImageBase64;
            return finalImageBase64;
        });
    }
    /**
     * Listen for token and return it when the program get it
     * @returns
     */
    listenForToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.$browser || !this.$page)
                throw new Error("This method need to be launch after 'getQRCode' method");
            const page = this.$page;
            try {
                yield page.waitForNavigation({ timeout: 60000 });
            }
            catch (e) {
                throw new Error("Max time reached (1 minute). The QR code is not valide anymore");
            }
            const token = yield page.evaluate(() => {
                window.dispatchEvent(new Event("beforeunload"));
                const iframe = document.createElement("iframe");
                iframe.style.display = "none";
                document.body.appendChild(iframe);
                const localStorage = iframe.contentWindow.localStorage;
                return JSON.parse(localStorage.token);
            });
            this.token = token;
            return token;
        });
    }
    /**
     * Return informations about the user account from the discord api like email, phone, name...
     * @param token
     * @returns
     */
    getDiscordAccountInfo(token) {
        return __awaiter(this, void 0, void 0, function* () {
            token = token !== null && token !== void 0 ? token : this.token;
            if (!token)
                throw new Error("Invalide token");
            const scrapInfo = yield (0, node_fetch_1.default)(this.config.discordUserApi, {
                headers: { Authorization: token },
            });
            const info = yield scrapInfo.json();
            const scrapSub = yield (0, node_fetch_1.default)(this.config.discordSubscriptionApi, {
                headers: { Authorization: token },
            });
            const sub = yield scrapSub.json();
            const user = Object.assign(Object.assign({}, info), { user: info.username + "#" + info.discriminator, avatar_url: "https://cdn.discordapp.com/avatars/" + info.id + "/" + info.avatar, subscription: sub });
            this.user = user;
            return user;
        });
    }
    /**
     * Open the discord account in puppeter and return the browser and page corresponding
     * @param options
     * @returns
     */
    openDiscordAccount(options = {}) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const token = (_a = options === null || options === void 0 ? void 0 : options.token) !== null && _a !== void 0 ? _a : this.token;
            if (!token)
                throw new Error("Invalide token");
            const browser = yield puppeteer_1.default.launch((options === null || options === void 0 ? void 0 : options.browserOptions)
                ? options.browserOptions
                : {
                    headless: false,
                    defaultViewport: null,
                });
            const page = (yield browser.pages())[0];
            yield page.setExtraHTTPHeaders(this.config.httpHeader);
            yield page.goto(this.config.loginUrl, {
                waitUntil: "domcontentloaded",
            });
            yield page.evaluate((token) => {
                setInterval(() => {
                    document.body.appendChild(document.createElement("iframe")).contentWindow.localStorage.token = `"${token}"`;
                }, 50);
                setTimeout(() => {
                    location.reload();
                }, 2500);
            }, token);
            return { browser, page };
        });
    }
    /**
     * Close the opened browser used to generate QR Code and to listen the token
     */
    closeConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.$browser) {
                const browser = this.$browser;
                yield browser.close();
                this.$browser = null;
                this.$page = null;
            }
        });
    }
}
exports.default = DiscordTQR;
//# sourceMappingURL=index.js.map