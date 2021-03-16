import { DID } from "dids";
import ThreeID from "3id-did-provider";
import ThreeIDResolver from "@ceramicnetwork/3id-did-resolver";
import { fromString } from "uint8arrays";
import Ceramic from "@ceramicnetwork/http-client";

export default async function signAsPDM(
  userDid: string,
  username: string,
  ceramicUrl: string = "http://localhost:3001"
): Promise<string> {
  return "";
}

// this is the actual server utility function
export async function _signAsPDM(
  message: string,
  seed: string,
  ceramicUrl: string
) {
  const authSecret = fromString(seed).slice(0, 32);
  const ceramic = new Ceramic(ceramicUrl);
  try {
    const threeID = await ThreeID.create({
      authId: "genesis",
      authSecret,
      getPermission: () => Promise.resolve([]),
      ceramic,
    });
    const provider = threeID.getDidProvider();
    await ceramic.setDIDProvider(provider);
    const resolver = ThreeIDResolver.getResolver(ceramic);
    const did = new DID({ provider, resolver });
    await did.authenticate();
    return did.createJWS(message);
  } finally {
    await ceramic.close();
  }
}
