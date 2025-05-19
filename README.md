# sarmacja-api

sarmacja-api to pakiet npm, który umożliwia integrację z systemem gospodarczym [Księstwa Sarmacji](https://sarmacja.org).

## Instalacja

Zainstaluj pakiet używając npm

```bash
  npm i sarmacja-api
```

lub

```bash
  npm install sarmacja-api
```

## Przykład

```javascript
import https from "https";
import fs from "fs";
import express from "express";
import Integracja from "sarmacja-api";

const app = express();

//TRzeba utworzyć lokalne certyfikaty, aby testować na localhoście
const sslOptions = {
  key: fs.readFileSync("./cert/key.pem"),
  cert: fs.readFileSync("./cert/cert.pem"),
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", async (req, res) => {
  console.log("Body:", req.body);

  const auth = new Integracja();
  auth.setConfiguration({
    appId: "S00337",
    appName: "Testowa Aplikacja",
    appSecret: "8ece3d390b03d318",
    adress: "https://localhost:3000/",
    options: {
      przelew: true,
      jednorazowyPrzelew: 100,
      dniowyPrzelew: 1000,
      powiadomienie: true,
    },
  });

  const user = await auth.getUser(req?.body);
  const wynik = await auth.getWynik();

  if (wynik?.error === 666) {
    res.send(
      `Dokonano zmiany uprawnień. Musisz się przeautoryzować <a href="${auth.loginURL()}">Kliknij tutaj</a>`
    );
  } else if (wynik?.error && wynik?.error !== 200) {
    console.log(wynik);
    res.send(`Błąd w żądaniu: ${wynik.errorD}`);
  } else if (!user) {
    res.send(
      `Użytkownik niezalogowany. <a href="${auth.loginURL()}">Kliknij tutaj, by się zalogować</a>`
    );
  } else {
    res.send(
      `Użytkownik ${user.paszport} zalogowany.<pre>${JSON.stringify(
        user,
        null,
        2
      )}</pre>`
    );
  }
});

app.post("/", async (req, res) => {
  console.log("Body:", req.body);

  const auth = new Integracja();
  auth.setConfiguration({
    appId: "X00000",
    appName: "Testowa Aplikacja",
    appSecret: "0000000000000000",
    adress: "https://localhost:3000/"
    options: {
      przelew: true,
      jednorazowyPrzelew: 100,
      dniowyPrzelew: 1000,
      powiadomienie: true,
    },
  });

  const user = await auth.getUser(req?.body);
  const wynik = await auth.getWynik();

  if (wynik?.error === 666) {
    res.send(
      `Dokonano zmiany uprawnień. Musisz się przeautoryzować <a href="${auth.loginURL()}">Kliknij tutaj</a>`
    );
  } else if (wynik?.error && wynik?.error !== 200) {
    console.log(wynik);
    res.send(`Błąd w żądaniu: ${wynik.errorD}`);
  } else if (!user) {
    res.send(
      `Użytkownik niezalogowany. <a href="${auth.loginURL()}">Kliknij tutaj, by się zalogować</a>`
    );
  } else {
    res.send(
      `Użytkownik ${user.paszport} zalogowany.<pre>${JSON.stringify(
        user,
        null,
        2
      )}</pre>`
    );
  }
});

// Start HTTPS server
https.createServer(sslOptions, app).listen(3000, () => {
  console.log("HTTPS server running at https://localhost:3000/");
});
```

Więcej informacji na temat użycia znajdziesz [tutaj](https://fc.sarmacja.org/viewtopic.php?f=1032&t=12815).

## Autorzy

- [@Nata-mikronacje](https://github.com/Nata-mikronacje)
