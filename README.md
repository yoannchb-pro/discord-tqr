# Discord-tqr

Generate QR code to get user token to login in, get informations ...

> **_NOTE:_** This project still in creation

## 💻 Installation

```
$ npm i discord-tqr
```

## 📚 Usage

Init

```js
const DiscordQRCodeTokenHandler = require("discord-tqr");
const handler = new DiscordQRCodeTokenHandler();
```

- Generate a QR Code

<img src="./assets/qr.png" alt="QR Code"></img>

```ts
//Generate a QR Code to specific path
const base64 = await handler.getQRCode({ path: "qr.png" });
```

- Listening for token

> **_NOTE:_** This method work only if you launch "getQRCode" before

```ts
//Return the token in a string
const token = await handler.listenForToken();
```

- Get user informations

```ts
//Return json object with user informations (the token is automatically pass with listenForToken)
const user = await handler.getDiscordAccountInfo(token?: string);
```

- Open user account

```ts
//Open discord account in chromium (the token is automatically pass with listenForToken)
await handler.openDiscordAccount(token?: string);
```

- Close connection or browser

```ts
//Close the openDiscordAccount browser
await handler.closeOpenedBrowserConnection();
//Close the browser used for generating the QR Code and for listenForToken
await handler.closeConnection();
```
