import jwt from "jsonwebtoken";
import { makeRandomString } from "../../utils";
import Auth from ".";

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

describe("SRP Authentication", () => {
  const username = makeRandomString(10);
  const auth = new Auth(username, makeRandomString(10));
  test("it registers an identity", async () => {
    const identityJWT = await createJWT({ username, verified: true });
    const registered = await auth.register(identityJWT);
    expect(registered).toBe(true);
  });

  test("it logs in the identity", async () => {
    const jwt = await auth.login();
    expect(typeof jwt).toBe("string");
    expect(auth.sessionKey).toBeTruthy();
  });

  test.todo("it allows user to send messages back and forth to/from server");
});
