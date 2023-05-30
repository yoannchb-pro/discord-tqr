import { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";
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
declare class DiscordTQR {
    token?: string;
    private $browser;
    private $page;
    qr: string;
    user: UserInfo;
    config: DiscordTQRConfig;
    constructor(token?: string);
    /**
     * Create a login QR Code
     * @param options
     * @returns
     */
    getQRCode(options?: {
        path?: string;
        browserOptions?: PuppeteerLaunchOptions;
        encoding?: string;
        wait?: number;
        template?: {
            path: string;
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        } | "default";
    }): Promise<string>;
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
    getDiscordAccountInfo(token?: string): Promise<UserInfo>;
    /**
     * Open the discord account in puppeter and return the browser and page corresponding
     * @param options
     * @returns
     */
    openDiscordAccount(options?: {
        token?: string;
        browserOptions?: PuppeteerLaunchOptions;
    }): Promise<{
        browser: Browser;
        page: Page;
    }>;
    /**
     * Close the opened browser used to generate QR Code and to listen the token
     */
    closeConnection(): Promise<void>;
}
export default DiscordTQR;
