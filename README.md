# sarmacja-api

sarmacja-api to pakiet npm, który umożliwia integrację z systemem gospodarczym [Księstwa Sarmacji](https://sarmacja.org.pl/).

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
import Integracja from "sarmacja-api";
import express from "express";

const app = express();

app.get("/", async (req, res) => {
  const auth = new Integracja();
  auth.setConfiguration({
    appId: "X#####",
    appName: "Testowa Aplikacja",
    appSecret: "0000000000000000",
    adress: "https://moja.aplikacja/integracja.html",
    options: {
      przelew: true,
      jednorazowyPrzelew: 100,
      dniowyPrzelew: 1000,
      powiadomienie: true,
    },
  });

  const user = await auth.getUser();
  const wynik = await auth.getWynik();

  if (wynik?.error === 666) {
    res.send(
      `Dokonano zmiany uprawnień. Musisz się przeautoryzować ${auth.loginURL()}`
    );
  } else if (wynik?.error && wynik?.error !== 200) {
    res.send(`Błąd w żądaniu ${wynik.errorD}`);
  } else if (!user) {
    res.send(`Użytkownik niezalogowany. ${auth.loginURL()}`);
  } else {
    res.send(
      `Użytkownik ${user.paszport} zalogowany.\n ${JSON.stringify(user)}`
    );
  }
});

app.listen(3000, () => {
  console.log("https://localhost:3000/");
});
```

Więcej informacji na temat użycia znajdziesz [tutaj](https://fc.sarmacja.org/viewtopic.php?f=1032&t=12815).

## Autorzy

- [@Nata-mikronacje](https://github.com/Nata-mikronacje)
