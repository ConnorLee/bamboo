import jwt from "jsonwebtoken";
import ThreeID from "3id-did-provider";
import { describe, expect, test } from "@jest/globals";
import { ScopeDirection, ScopesV2 } from "@daemon-land/types";
import { ManagedIdentity, Web2Identity } from ".";
import { makeRandomString, _signAsPDM, getPDMSessionToken } from "../../utils";

const CERAMIC_URL = "http://localhost:7007";
const DL_URL = "http://localhost:3001";
const DL_RPC = `${DL_URL}/rpc/v0`;

// we mock this call and just imitate what its like in the backend handlers
jest
  .spyOn(require("../../utils/signAsPDM"), "default")
  .mockImplementation(async (operandDID) => {
    // this is the exact same method as the api handler
    const jws = await _signAsPDM(
      operandDID as string,
      process.env.PDM_SEED as string,
      CERAMIC_URL
    );
    const token = await getPDMSessionToken(jws);
    return token;
  });

const globalAny: any = global;

const createJWT = (claims: object): Promise<string> =>
  new Promise((resolve, reject) => {
    return jwt.sign(
      claims,
      globalAny.JWT_SECRET as jwt.Secret,
      (err, token) => {
        if (err) reject(err);
        else resolve(token!);
      }
    );
  });

describe("Web2Identity", () => {
  const username = makeRandomString(10);
  const password = makeRandomString(10);
  // used by future tests
  let appDID: string = "";
  test("it allows for signup with a username and a password", async () => {
    const identityJWT = await createJWT({ username, verified: true });
    const identity = new Web2Identity(username, password, {
      url: DL_URL,
      ceramicUrl: CERAMIC_URL,
    });
    const did = await identity.signup(identityJWT);
    expect(did.includes("did:3")).toBe(true);
  });

  test("it allows for logging in with a username and a password", async () => {
    const identity = new Web2Identity(username, password, {
      url: DL_URL,
      ceramicUrl: CERAMIC_URL,
    });
    const threeID = await identity.login();
    expect(threeID.includes("did:3")).toBe(true);
    appDID = threeID;
  });

  test("signing up without a valid identity token throws a 403", async () => {
    const username = makeRandomString(10);
    const password = makeRandomString(10);
    const identity = new Web2Identity(username, password, {
      url: DL_URL,
      ceramicUrl: CERAMIC_URL,
    });
    await expect(identity.signup("")).rejects.toThrow();
  });

  test.skip("signing up twice throws an error", async () => {
    const username = makeRandomString(10);
    const password = makeRandomString(10);
    const identityJWT = await createJWT({ username, verified: true });

    const identity = new Web2Identity(username, password, {
      url: DL_URL,
      ceramicUrl: CERAMIC_URL,
    });
    const did = await identity.signup(identityJWT);
    expect(did.includes("did:3")).toBe(true);
    await expect(identity.signup(identityJWT)).rejects.toThrow();
  });

  test.todo("Logging in with a bad password throws a bad password error");
});

describe("ManagedIdentity", () => {
  const username = makeRandomString(10);
  const password = makeRandomString(10);
  let web2Identity: Web2Identity;
  let threeID: ThreeID;
  let managedIdentity: ManagedIdentity;
  beforeAll(async () => {
    const identityJWT = await createJWT({ username, verified: true });
    web2Identity = new Web2Identity(username, password, {
      url: DL_URL,
      ceramicUrl: CERAMIC_URL,
    });
    await web2Identity.signup(identityJWT);
    threeID = web2Identity.did!;
  });

  test("static create creates an authenticated managed identity instance", async () => {
    managedIdentity = await ManagedIdentity.create(threeID, {
      ceramicUrl: CERAMIC_URL,
      url: DL_RPC,
    });

    expect(managedIdentity.authenticated).toBe(true);
  });

  test("managed identity can create and get a profile", async () => {
    await managedIdentity.profile.create({
      name: username,
      imageUrl: "http://localhost:5011/ipfs/Qmz...",
      callbackUrl: "http://localhost:3001/callback",
    });
    const profile = await managedIdentity.profile.get();
    expect(profile?.name).toBe(username);
    expect(profile?.imageUrl).toBe("http://localhost:5011/ipfs/Qmz...");
    expect(profile?.callbackUrl).toBe("http://localhost:3001/callback");
  });

  test("managed identity can create and get permissions", async () => {
    await managedIdentity.permissions.add({
      resource: "PROFILE",
      permission: ScopesV2.Read | ScopeDirection.Granted,
      did: "did:3:test",
    });

    const perm = await managedIdentity.permissions.get({
      did: "did:3:test",
      resource: "PROFILE",
    });

    expect(perm?.permission).toBe(ScopesV2.Read | ScopeDirection.Granted);
  });

  test("generateReturnURL returns a url with a code and state", async () => {
    const returnURL = await managedIdentity.generateReturnURL(
      // this is a little meta - were generating a return value for ourselves just to make sure this works
      managedIdentity.did?.id!,
      65,
      "PROFILE",
      "some-state"
    );
    const params = new URLSearchParams(returnURL.split("?")[1]);
    expect(params.get("code")).toBeTruthy();
    expect(params.get("state")).toBe("some-state");
    expect(returnURL.includes("http://localhost:3001/callback")).toBeTruthy();
  });

  test.todo("saving permission saves the permission in IDX");
  test.todo("saving profile saves the profile in IDX");
});
