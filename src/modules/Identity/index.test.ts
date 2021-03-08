import Identity from ".";
import { makeRandomString } from "../../utils";

describe("identityv2", () => {
  const username = makeRandomString(10);
  const password = makeRandomString(10);
  test("it allows for signup with a username and a password", async () => {
    const identity = new Identity(username, password, {
      url: "http://localhost:3001",
      ceramicUrl: "http://localhost:7007",
    });
    const threeID = await identity.signup();
    expect(threeID.includes("did:3")).toBe(true);
  });

  test("signing up twice produces the same DID", async () => {
    const username = makeRandomString(10);
    const password = makeRandomString(10);
    const identity = new Identity(username, password, {
      url: "http://localhost:3001",
      ceramicUrl: "http://localhost:7007",
    });
    const threeID = await identity.signup();
    const threeID2 = await identity.signup();
    expect(threeID).toBe(threeID2);
  });
});
