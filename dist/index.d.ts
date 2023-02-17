import puppeteer from "puppeteer";
type DiscordTQRConfig = {
    loginUrl: string;
    discordUserApi: string;
    discordSubscriptionApi: string;
    httpHeader: Record<string, string>;
};
declare class DiscordTQR {
    token?: string;
    private $browser;
    private $page;
    qr: string;
    user: any;
    config: DiscordTQRConfig;
    constructor(token?: string);
    /**
     * Create a login QR Code
     * @param options
     * @returns
     */
    getQRCode(options?: {
        path?: string;
        browserOptions?: puppeteer.PuppeteerLaunchOptions;
        encoding?: string;
        wait?: number;
        template?: {
            path: string;
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        } | "default";
    }): Promise<any>;
    /**
     * Listen for token and return it when the program get it
     * @returns
     */
    listenForToken(): Promise<string>;
    /**
     * Return informations about the user account from the discord api like email, phone, name...
     * @param token
     * @returns
     */
    getDiscordAccountInfo(token?: string): Promise<any>;
    /**
     * Open the discord account in puppeter and return the browser and page corresponding
     * @param options
     * @returns
     */
    openDiscordAccount(options?: {
        token?: string;
        browserOptions?: puppeteer.PuppeteerLaunchOptions;
    }): Promise<{
        browser: puppeteer.Browser;
        page: puppeteer.Page;
    }>;
    /**
     * Close the opened browser used to generate QR Code and to listen the token
     */
    closeConnection(): Promise<void>;
}
export default DiscordTQR;
