import axios from "axios";
import srp from "@kapetan/secure-remote-password/client";
import params from "@kapetan/secure-remote-password/parameters";
import {
  xc20pDirEncrypter,
  xc20pDirDecrypter,
  createJWE,
  decryptJWE,
  JWE,
} from "did-jwt";
import { fromString, toString } from "uint8arrays";
import crypto from "crypto";

const p = params(2048);

export default class Auth {
  public url: string;
  public username: string;
  protected authenticated: boolean = false;
  #password: string;
  #sessionKey?: Buffer;

  constructor(
    username: string,
    password: string,
    url: string = "http://localhost:3001"
  ) {
    this.username = username;
    this.#password = password;
    this.url = url;
  }

  get sessionKey() {
    return this.#sessionKey;
  }

  async register(validIdentityToken: string): Promise<boolean> {
    const salt = srp.generateSalt(p);
    const privateKey = srp.derivePrivateKey(
      salt,
      this.username,
      this.#password,
      p
    );
    const verifier = srp.deriveVerifier(privateKey, p);
    const res = await axios.post(
      `${this.url}/v0/auth/register`,
      {
        username: this.username,
        salt,
        verifier,
      },
      {
        headers: {
          Authorization: `Bearer ${validIdentityToken}`,
        },
      }
    );
    if (res.status !== 201)
      throw new Error("Error creating salt and verifier.");
    return true;
  }

  async login(): Promise<string> {
    const clientEphemeral = srp.generateEphemeral(p);
    const loginRes = await axios.post(`${this.url}/v0/auth/login`, {
      username: this.username,
      clientEphemeralKey: clientEphemeral.public,
    });

    if (loginRes.status !== 201) throw new Error("Error loggin in identity");

    const { salt, serverPubkey } = loginRes.data;
    const privateKey = srp.derivePrivateKey(
      salt,
      this.username,
      this.#password,
      p
    );
    const clientSession = srp.deriveSession(
      clientEphemeral.secret,
      serverPubkey,
      salt,
      this.username,
      privateKey,
      p
    );
    const proofRes = await axios.post(`${this.url}/v0/auth/proof`, {
      username: this.username,
      clientSessionProof: clientSession.proof,
    });

    if (proofRes.status !== 201) throw new Error("Error loggin in identity");
    srp.verifySession(
      clientEphemeral.public,
      clientSession,
      proofRes.data.proof,
      p
    );

    this.#sessionKey = crypto
      .createHash("shake256", { outputLength: 32 })
      .update(clientSession.key)
      .digest();

    this.authenticated = true;
    return proofRes.data.token;
  }

  async encryptMsg(message: string) {
    if (!this.authenticated)
      throw new Error("Must authenticate before encrypting messages.");
    return createJWE(fromString(message), [
      xc20pDirEncrypter(this.#sessionKey!),
    ]);
  }

  async decryptMsg(encryptedJWE: JWE): Promise<string> {
    if (!this.authenticated)
      throw new Error("Must authenticate before decrypting messages.");
    const message = await decryptJWE(
      encryptedJWE,
      xc20pDirDecrypter(this.#sessionKey!)
    );
    return toString(message);
  }
}
