import { DagJWS, DID } from "dids";
import axios from "axios";
import ThreeID from "3id-did-provider";
import ThreeIDResolver from "@ceramicnetwork/3id-did-resolver";
import { fromString } from "uint8arrays";
import Ceramic from "@ceramicnetwork/http-client";

// this is its own separate func so we can mock it in tests
export default async function signAsPDM(
  operandDID: string,
  jws: DagJWS
): Promise<string> {
  const res = await axios.post("/api/v0/identity", {
    operandDID,
    jws,
  });
  if (res.status !== 201) throw new Error("Error getting PDM session token.");
  return res.data;
}

function isSigner(kid: string, did: string): boolean {
  const allegedDID = kid.split("?version-id")[0];
  return allegedDID === did;
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
  matchingSig: DagJWS,
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
    const did = new DID({ resolver, provider });
    await did.authenticate();
    const { kid } = await did.verifyJWS(matchingSig);
    if (!isSigner(kid, operandDID)) {
      throw new Error("Bad signature");
    }

    return did.createJWS({ operandDID });
  } finally {
    await ceramic.close();
  }
}
