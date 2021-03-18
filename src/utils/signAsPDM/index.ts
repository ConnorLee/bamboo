import { DagJWS, DID } from "dids";
import axios from "axios";
import ThreeID from "3id-did-provider";
import ThreeIDResolver from "@ceramicnetwork/3id-did-resolver";
import { fromString } from "uint8arrays";
import Ceramic from "@ceramicnetwork/http-client";

// this is its own separate func so we can mock it in tests
export default async function signAsPDM(operandDID: string): Promise<string> {
  const res = await axios.post("/api/v0/identity", {
    operandDID,
  });
  if (res.status !== 201) throw new Error("Error getting PDM session token.");
  return res.data;
}

export async function getPDMSessionToken(jws: DagJWS): Promise<string> {
  const res = await axios.post(
    `${
      process.env.NEXT_PUBLIC_DL_URL || "http://localhost:3001"
    }/v0/pdm/verify-signature`,
    {
      jws,
    }
  );
  if (res.status !== 201) throw new Error("Error getting PDM session token.");
  return res.data.token;
}

// this is the actual server utility function
export async function _signAsPDM(
  operandDID: string,
  seed: string,
  ceramicUrl: string
) {
  const ceramic = new Ceramic(ceramicUrl);
  try {
    const threeID = await ThreeID.create({
      seed: fromString(seed).slice(0, 32),
      getPermission: () => Promise.resolve([]),
      ceramic,
    });
    console.log("PDM DID: ", threeID.id);
    const provider = threeID.getDidProvider();
    await ceramic.setDIDProvider(provider);
    const resolver = ThreeIDResolver.getResolver(ceramic);
    const did = new DID({ provider, resolver });
    await did.authenticate();
    return did.createJWS({ operandDID });
  } finally {
    await ceramic.close();
  }
}
