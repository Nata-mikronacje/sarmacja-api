import { createHash, createCipheriv, createDecipheriv } from "crypto";
import axios from "axios";
import { URLSearchParams } from "url";

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

    this._session = {
      at: null,
      user: null,
    };
  }

  setConfiguration(config) {
    if (
      !config ||
      !config.appId ||
      !config.appSecret ||
      !config.adress ||
      !config.appName
    ) {
      throw new Error(
        "Brak pliku konfiguracyjnego. Aplikacja została automatycznie wyłączona."
      );
    }

    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.adress = config.adress;
    this.appName = config.appName;
    this.options = Buffer.from(JSON.stringify(config.options || {})).toString(
      "base64"
    );
    this.config = config;

    this.accessToken = this._session.at;
    this.user = this._session.user;

    this.iv = createHash("sha256")
      .update(this.appSecret)
      .digest("hex")
      .substring(0, 16);
    this.wynik.error = 200;
  }

  async action(parm, action) {
    if (!this.appSecret) {
      this.wynik = { error: 500, errorD: "Brak podstawowych parametrów." };
      return;
    }

    parm.appS = this.appSecret;
    parm.userToken = this.accessToken;

    const data = {
      dane: this.encrypt(JSON.stringify(parm)),
      appId: this.appId,
    };

    this.wynik = await this._request(data, action);
  }

  async przelew(parm) {
    if (!this.appSecret) {
      this.wynik = { error: 500, errorD: "Brak podstawowych parametrów." };
      return;
    }

    parm.appS = this.appSecret;
    parm.userToken = this.accessToken;
    parm.przelewId = Math.floor(Math.random() * 9000 + 1000);

    const data = {
      dane: this.encrypt(JSON.stringify(parm)),
      appId: this.appId,
    };

    this.wynik = await this._request(data, "przelew");

    if (
      this.wynik.error === 200 &&
      this.decrypt(this.wynik.body) != parm.przelewId
    ) {
      this.wynik.error = 700;
      this.wynik.errorD = "Ktoś stara się oszukać system.";
    }
  }

  async ogolnaIntegracja(parm, action) {
    this.wynik = await this._request(parm, action);
  }

  async _request(data, method) {
    const url = `${this.sarmaUrl}+${method}/`;
    const form = new URLSearchParams(data).toString();

    try {
      const res = await axios.post(url, form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return res.data;
    } catch (err) {
      return { error: 500, errorD: err.message };
    }
  }

  loginURL() {
    return `${this.sarmaUrl}auth2/?options=${
      this.options
    }&redirect=${Buffer.from(this.adress).toString(
      "base64"
    )}&appName=${Buffer.from(this.appName).toString("base64")}&appId=${
      this.appId
    }`;
  }

  async getUser(post) {
    if (!this.user) {
      await this._autorization(post);
    } else {
      await this._userUpdate();
    }
    return this.user;
  }

  getWynik() {
    return this.wynik;
  }

  getAppPass() {
    return this.appSecret;
  }

  encrypt(text) {
    const cipher = createCipheriv("aes-128-cbc", this.appSecret, this.iv);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    encrypted = Buffer.from(encrypted).toString("base64");
    return encrypted;
  }

  decrypt(text) {
    const decipher = createDecipheriv("aes-128-cbc", this.appSecret, this.iv);
    let decrypted = decipher.update(text, "base64", "utf8");
    decrypted += decipher.final("utf8");
    decrypted = Buffer.from(decrypted).toString("utf8");
    return decrypted;
  }

  async _autorization(post) {
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

        this._session.at = this.accessToken;
        this._session.user = this.user;
      }
    }
  }

  async _userUpdate() {
    if (!this.user?.paszport) return;

    const parm = { userId: this.user.paszport };
    const result = await this._request(parm, "commonUserData");

    if (result.error === 200) {
      this.user = result.body;
      this._session.user = this.user;
    }
  }
}

export default Integracja;
