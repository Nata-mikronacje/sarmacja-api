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

const auth = Integracja();
auth.setConfiguration({
  appId: "X#####", //ID instytucji
  appName: "Testowa Aplikacja", //Nazwa aplikacji
  appSecret: "0000000000000000", //Hasło aplikacji do pobrania w panelu edycji profilu instytucji
  adress: "https://moja.aplikacja/integracja.html", //Adres zwrotny do naszej aplikacji
  options: {
    przelew: true, //Określa możliwość wykonywania autoryzowanych przelewów przez aplikację
    jednorazowyPrzelew: 100, //Maksymalona kwota pojedyńczego przelewu
    dniowyPrzelew: 1000, //Maksymalna wartość przelewów w ciągu 24h
    powiadomienie: true,
  },
});
let user = auth.getUser();
let wynik = auth.getWynik();

if (
  wynik["error"] !== undefined &&
  wynik["error"] !== null &&
  wynik["error"] &&
  wynik["error"] === 666
) {
  console.log(
    `Dokonano zmiany uprawnień. Musisz się przeautoryzować ${auth.loginURL()}`
  );
} else if (
  wynik["error"] !== undefined &&
  wynik["error"] !== null &&
  wynik["error"] !== 200
) {
  console.log(`Błąd w żądaniu ${wynik["errorD"]}`);
} else if (user === undefined || user === null || user === "") {
  console.log(`Użytkownik niezalogowany. ${auth.loginURL()}`);
} else {
  console.log(`Użytkownik ${user["paszport"]} zalogowany.\n ${user}`);
}
```

Więcej informacji na temat użycia znajdziesz [tutaj](https://fc.sarmacja.org/viewtopic.php?f=1032&t=12815).

## Autorzy

- [@Nata-mikronacje](https://github.com/Nata-mikronacje)
