import jwt from "jsonwebtoken";
import { describe, expect, test } from "@jest/globals";
import Identity from ".";
import { makeRandomString } from "../../utils";

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

describe("identityv2", () => {
  const username = makeRandomString(10);
  const password = makeRandomString(10);
  test("it allows for signup with a username and a password", async () => {
    const identityJWT = await createJWT({ username, verified: true });
    const identity = new Identity(username, password, {
      url: "http://localhost:3001",
      ceramicUrl: "http://localhost:7007",
    });
    const threeID = await identity.signup(identityJWT);
    expect(threeID.includes("did:3")).toBe(true);
  });

  test("it allows for logging in with a username and a password", async () => {
    const identity = new Identity(username, password, {
      url: "http://localhost:3001",
      ceramicUrl: "http://localhost:7007",
    });
    const threeID = await identity.login();
    expect(threeID.includes("did:3")).toBe(true);
  });

  test("signing up without a valid identity token throws a 403", async () => {
    const username = makeRandomString(10);
    const password = makeRandomString(10);
    const identity = new Identity(username, password, {
      url: "http://localhost:3001",
      ceramicUrl: "http://localhost:7007",
    });
    await expect(identity.signup("")).rejects.toThrow();
  });

  test("signing up twice throws an error", async () => {
    const username = makeRandomString(10);
    const password = makeRandomString(10);
    const identityJWT = await createJWT({ username, verified: true });

    const identity = new Identity(username, password, {
      url: "http://localhost:3001",
      ceramicUrl: "http://localhost:7007",
    });
    const threeID = await identity.signup(identityJWT);
    expect(threeID.includes("did:3")).toBe(true);
    await expect(identity.signup(identityJWT)).rejects.toThrow();
  });
});
