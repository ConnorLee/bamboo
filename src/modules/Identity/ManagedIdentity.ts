import ThreeID from "3id-did-provider";
import { DID } from "dids";
import { Resource } from "@daemon-land/types";
import Ceramic from "@ceramicnetwork/http-client";
import ThreeIDResolver from "@ceramicnetwork/3id-did-resolver";
import { randomBytes } from "tweetnacl";
import { toString } from "uint8arrays";

import { AccessController, Profile } from "../SDKWrappers";
import { generateReturnURL, signAsPDM } from "../../utils";

export default class ManagedIdentity {
  private _did: ThreeID | null = null;
  public url: string = "";
  public ceramicUrl: string;
  public appToken: string = "";
  public profile: Profile;
  public permissions: AccessController;
  constructor(
    did: ThreeID,
    opts?: Partial<{ url: string; ceramicUrl: string; sessionToken: string }>
  ) {
    if (!did) throw new Error("Must pass ThreeID instance to ManagedIdentity");
    this.url = opts?.url || "http://locahost:3001";
    this.ceramicUrl = opts?.ceramicUrl || "http://localhost:7007";
    this.appToken = opts?.sessionToken || "";
    this._did = did;
    this.profile = new Profile(did, opts);
    this.permissions = new AccessController(did, opts);
  }

  get did() {
    return this._did;
  }

  get authenticated() {
    return !!this.appToken;
  }

  static async create(
    did: ThreeID,
    opts?: Partial<{ url: string; ceramicUrl: string; sessionToken: string }>
  ) {
    let token = opts?.sessionToken;
    if (!token) {
      const ceramic = new Ceramic(
        opts?.ceramicUrl || process.env.NEXT_PUBLIC_CERAMIC_URL
      );

      try {
        // here we have the user sign a message,
        // so that on the server side, the PDM backend can verify the DID it is about to sign
        // is being requested by the owner of the DID (i.e. you can't ask the PDM to sign someone else's DID for you)
        const provider = did.getDidProvider();
        await ceramic.setDIDProvider(provider);
        const resolver = ThreeIDResolver.getResolver(ceramic);
        const signer = new DID({ provider, resolver });
        await signer.authenticate();
        // here it doesnt actually matter what we sign
        // just need the signer
        const jws = await signer.createJWS({
          message: toString(randomBytes(32)),
        });
        token = await signAsPDM(did.id, jws);
      } finally {
        await ceramic.close();
      }
    }

    return new ManagedIdentity(did, { sessionToken: token, ...opts });
  }

  async generateReturnURL(
    requesterDID: string,
    permission: number,
    resource: Resource,
    state?: string
  ): Promise<string> {
    return generateReturnURL(
      requesterDID,
      permission,
      resource,
      this.appToken,
      this.url,
      state
    );
  }
}
