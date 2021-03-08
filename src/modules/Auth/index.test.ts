import { makeRandomString } from "../../utils";
import Auth from ".";

describe("SRP Authentication", () => {
  const auth = new Auth(makeRandomString(10), makeRandomString(10));
  test("it registers an identity", async () => {
    const registered = await auth.register();
    expect(registered).toBe(true);
  });

  test("it logs in the identity", async () => {
    const jwt = await auth.login();
    expect(typeof jwt).toBe("string");
    expect(auth.sessionKey).toBeTruthy();
  });

  test.todo("it allows user to send messages back and forth to/from server");
});
