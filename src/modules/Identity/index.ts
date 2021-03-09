import axios from "axios";
import { JWE } from "did-jwt";
import Ceramic from "@ceramicnetwork/http-client";
import ThreeID from "3id-did-provider";
import tweetnacl from "tweetnacl";
import { concat, fromString } from "uint8arrays";
import Auth from "../Auth";

type DID = string;

export default class Identity {
  public auth: Auth;
  public url: string;
  public ceramicUrl: string;
  public _did: string = "";
  public token: string = "";
  #password: string;
  constructor(
    username: string,
    password: string,
    opts?: { url: string; ceramicUrl: string }
  ) {
    this.auth = new Auth(username, password, opts?.url);
    this.url = opts?.url || "http://locahost:3001";
    this.ceramicUrl = opts?.ceramicUrl || "http://localhost:7007";
    this.#password = password;
  }

  get did() {
    return this._did;
  }

  set did(did: string) {
    this._did = did;
  }

  async getSecret(): Promise<any> {
    const res = await axios.get(`${this.url}/v0/identity/secret`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (res.status !== 200) throw new Error("Error getting secret");
    const salt = res.data.salt as JWE;
    return this.auth.decryptMsg(salt);
  }

  async signup(validIdentityToken: string): Promise<DID> {
    if (!validIdentityToken)
      throw new Error(
        "Must pass validIdentityToken to signup call (prove your identity first)."
      );
    const registered = await this.auth.register(validIdentityToken);
    if (!registered) throw new Error("Auth error - registering user.");
    const sessionToken = await this.auth.login();
    if (!sessionToken) throw new Error("Auth error - logging in user");
    this.token = sessionToken;
    const secretSalt = await this.getSecret();
    // TODO: investigate slices
    const authSecret = tweetnacl
      .hash(concat([fromString(secretSalt), fromString(this.#password)]))
      .slice(0, 32);
    const ceramic = new Ceramic(this.ceramicUrl);
    try {
      const threeID = await ThreeID.create({
        authId: "genesis",
        authSecret,
        getPermission: () => Promise.resolve([]),
        ceramic,
      });
      await ceramic.setDIDProvider(threeID.getDidProvider());
      const res = await axios.post(
        `${this.url}/v0/identity`,
        {
          username: this.auth.username,
          did: threeID.id,
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );
      if (res.status !== 201) throw new Error("Error creating user");
      this.did = threeID.id;
      return threeID.id;
    } finally {
      await ceramic.close();
    }
  }

  async login(): Promise<DID> {
    const sessionToken = await this.auth.login();
    if (!sessionToken) throw new Error("Auth error - logging in user");
    this.token = sessionToken;
    const secretSalt = await this.getSecret();
    // TODO: investigate slices
    const authSecret = tweetnacl
      .hash(concat([fromString(secretSalt), fromString(this.#password)]))
      .slice(0, 32);
    const ceramic = new Ceramic(this.ceramicUrl);
    try {
      const threeID = await ThreeID.create({
        authId: "genesis",
        authSecret,
        getPermission: () => Promise.resolve([]),
        ceramic,
      });
      await ceramic.setDIDProvider(threeID.getDidProvider());
      const res = await axios.get(`${this.url}/v0/identity`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      if (res.status !== 200) throw new Error("Error logging in user");
      if (threeID.id !== res.data.did) throw new Error("DID Mismatch");
      this.did = threeID.id;
      return threeID.id;
    } finally {
      await ceramic.close();
    }
  }
}
