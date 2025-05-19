const crypto = require("crypto");
const axios = require("axios");

class Integracja {
  constructor() {
    this.appId = null;
    this.appSecret = null;
    this.appName = null;
    this.user = null;
    this.wynik = {};
    this.accessToken = null;
    this.adress = null;
    this.options = null;
    this.config = null;
    this.sarmaUrl = "https://www.sarmacja.org/integracja/";
    this.iv = null;
    this._session = {};
  }

  setSession({ user = null, at = null }) {
    if (!this._session) this._session = {};
    if (user) this.user = user;
    if (at) this._session.at = at;
    if (user) this._session.user = user;
  }

  setConfiguration(config) {
    if (!this._session) this._session = {};
    if (config && Object.keys(config).length > 0) {
      if (config.appId && config.appSecret && config.adress && config.appName) {
        this.appId = config.appId;
        this.appSecret = config.appSecret;
        this.adress = config.adress;
        if (!config.options) config.options = {};
        this.options = Buffer.from(JSON.stringify(config.options)).toString(
          "base64"
        );

        this.appName = config.appName;
        if (this._session.at) this.accessToken = this._session.at;
        if (this._session.user) this.user = this._session.user;
        this.config = config;
        this.iv = crypto
          .createHash("sha256")
          .update(this.appSecret)
          .digest("hex")
          .substring(0, 16);
        this.wynik.error = 200;
      } else {
        throw new Error(
          "Plik konfiguracyjny niepełny. Aplikacja została automatycznie wyłączona."
        );
      }
    } else {
      throw new Error(
        "Brak pliku konfiguracyjnego. Aplikacja została automatycznie wyłączona."
      );
    }
  }

  async action(parm, action) {
    if (!this.appSecret) {
      this.wynik.error = 500;
      this.wynik.errorD =
        "Niemożliwe wykonanie akcji. Brak podstawowych parametrów.";
    } else {
      parm.appS = this.appSecret;
      parm.userToken = parm.aT;
      const dane = {
        dane: this.encrypt(JSON.stringify(parm)),
        appId: this.appId,
      };

      this.wynik = await this.request(dane, action);
    }
  }

  async przelew(parm) {
    if (!this.appSecret) {
      this.wynik.error = 500;
      this.wynik.errorD =
        "Niemożliwe wykonanie akcji. Brak podstawowych parametrów.";
    } else {
      parm.appS = this.appSecret;
      parm.userToken = this.accessToken;
      parm.przelewId = Math.floor(Math.random() * 9000) + 1000;
      const dane = {
        dane: this.encrypt(JSON.stringify(parm)),
        appId: this.appId,
      };
      this.wynik = await this.request(dane, "przelew");
      if (
        this.wynik.error === 200 &&
        this.decrypt(this.wynik.body) != parm.przelewId
      ) {
        this.wynik.error = 700;
        this.wynik.errorD = "Ktoś stara się oszukać system.";
      }
    }
  }

  async ogolnaIntegracja(parm, action) {
    this.wynik = await this.request(parm, action);
  }

  async autorization(post) {
    if (post && post.at) {
      const parm = {
        aT: post.at,
        upr: this.options,
        appS: this.appSecret,
        appI: this.appId,
        userId: post.paszport,
      };
      await this.action(parm, "login");
      if (this.wynik.error === 200) {
        this.user = this.wynik.body;
        this.accessToken = post.at;
        this._session.at = post.at;
        this._session.user = this.user;
      }
    }
  }

  async userUpdate() {
    const parm = { userId: this.user.paszport };
    await this.ogolnaIntegracja(parm, "commonUserData");
    if (this.wynik.error === 200) {
      this.user = this.wynik.body;
      this._session.user = this.user;
    }
  }

  async request(data, method) {
    const url = this.sarmaUrl + "+" + method + "/";
    try {
      const response = await axios.post(url, this.getUrl(data, 0), {
        maxRedirects: 5,
        validateStatus: () => true,
      });
      return response.data;
    } catch (e) {
      return { error: 500, errorD: "Błąd połączenia: " + e.message };
    }
  }

  loginURL() {
    return (
      this.sarmaUrl +
      "auth2/?options=" +
      this.options +
      "&redirect=" +
      Buffer.from(this.adress).toString("base64") +
      "&appName=" +
      Buffer.from(this.appName).toString("base64") +
      "&appId=" +
      this.appId
    );
  }

  async getUser(post = {}) {
    if (!this.user) {
      await this.autorization(post);
    } else {
      await this.userUpdate();
    }
    return this.user;
  }

  getWynik() {
    return this.wynik;
  }

  getUrl(parm, opt = 1) {
    const query = new URLSearchParams(parm).toString();
    if (opt) {
      return this.sarmaUrl + "?" + query;
    } else {
      return query;
    }
  }

  getAppPass() {
    return this.appSecret;
  }

  encrypt(string) {
    const cipher = crypto.createCipheriv(
      "aes-128-cbc",
      Buffer.from(this.appSecret.substring(0, 16), "utf8"),
      Buffer.from(this.iv, "utf8")
    );
    let encrypted = cipher.update(string, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    // First base64 encoding (like openssl_encrypt with option 0)
    const base64Once = encrypted.toString("base64");
    // Second base64 encoding (like base64_encode in PHP)
    const base64Twice = Buffer.from(base64Once, "utf8").toString("base64");

    return base64Twice;
  }

  decrypt(string) {
    const decipher = crypto.createDecipheriv(
      "aes-128-cbc",
      this.appSecret.substring(0, 16),
      this.iv
    );
    let decrypted = decipher.update(string, "base64", "utf8");
    decrypted += decipher.final("utf8");

    const base64Once = decrypted.toString("base64");
    // Second base64 encoding (like base64_encode in PHP)
    const base64Twice = Buffer.from(base64Once, "utf8").toString("base64");
    return base64Twice;
  }
}

module.exports = Integracja;
