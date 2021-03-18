import CeramicClient from "@ceramicnetwork/http-client";
import ThreeIDResolver from "@ceramicnetwork/3id-did-resolver";
import ThreeID from "3id-did-provider";
import { fromString } from "uint8arrays";
import { describe, expect, test } from "@jest/globals";
import { DagJWS, DID } from "dids";
import { _signAsPDM, getPDMSessionToken } from ".";

describe("signAsPDM", () => {
  let ceramic: CeramicClient;
  let pdmDID: string = "";
  beforeAll(async () => {
    ceramic = new CeramicClient("http://localhost:7007");
    const threeID = await ThreeID.create({
      seed: fromString(process.env.PDM_SEED!).slice(0, 32),
      getPermission: () => Promise.resolve([]),
      ceramic,
    });
    const provider = threeID.getDidProvider();
    await ceramic.setDIDProvider(provider);
    pdmDID = threeID.id;
  });

  afterAll(async () => {
    await ceramic.close();
  });
  let sig: string = "";
  test("it signs a message as the PDM", async () => {
    if (!pdmDID) throw new Error("PDM DID needed for tests to run");
    const jws = await _signAsPDM(
      "message",
      process.env.PDM_SEED!,
      "http://localhost:7007"
    );
    expect(jws.payload).toBeTruthy();
    expect(jws.signatures[0].protected).toBeTruthy();
    expect(jws.signatures[0].signature).toBeTruthy();
    sig = JSON.stringify(jws);
  });

  test("the signature can be verified", async () => {
    if (!sig) throw new Error("Test failed because no sig from first test");

    const jws = JSON.parse(sig) as DagJWS;
    const resolver = ThreeIDResolver.getResolver(ceramic);

    const did = new DID({ resolver });
    const { kid } = await did.verifyJWS(jws);
    expect(kid.includes(pdmDID)).toBe(true);
  });

  test("getPDMSessionToken gets a session token from the DL API", async () => {
    const sessionToken = await getPDMSessionToken(JSON.parse(sig) as DagJWS);
    expect(sessionToken).toBeTruthy();
  });
});
