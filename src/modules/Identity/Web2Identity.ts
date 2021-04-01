import axios from "axios";
import { JWE } from "did-jwt";
import Ceramic from "@ceramicnetwork/http-client";
import ThreeID from "3id-did-provider";
import Auth from "../Auth";
import { SHAKE } from "sha3";

type DID = string;

/**
 * The goal of this class is to wrap IDX with SRP, so we can use web2 logins to reliably produce DIDs
 *
 * The login and signup methods both spit out a DID and a PDM session token
 */
export default class Web2Identity {
  public auth: Auth;
  public url: string;
  public ceramicUrl: string;
  public _did: ThreeID | null = null;
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

  get did(): ThreeID | null {
    return this._did;
  }

  digestAuthSecret(salt: string, password: string): Buffer {
    const hash = new SHAKE(256);
    hash.update(salt);
    hash.update(password);
    return hash.digest();
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
    const authSecret = this.digestAuthSecret(secretSalt, this.#password);

    const ceramic = new Ceramic(this.ceramicUrl);
    try {
      const threeID = await ThreeID.create({
        // TODO: replace back in
        // authId: "genesis",
        // authSecret,
        seed: authSecret,
        getPermission: () => Promise.resolve([]),
        ceramic,
      });
      await ceramic.setDIDProvider(threeID.getDidProvider());
      // TODO set services to PDM on IDX
      // TODO set permissions to ROOT PDM on IDX
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
      this._did = threeID;
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
    const authSecret = this.digestAuthSecret(secretSalt, this.#password);

    const ceramic = new Ceramic(this.ceramicUrl);
    try {
      const threeID = await ThreeID.create({
        // TODO: put back in
        // authId: "genesis",
        // authSecret,
        seed: authSecret,
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
      this._did = threeID;
      return threeID.id;
    } finally {
      await ceramic.close();
    }
  }
}
