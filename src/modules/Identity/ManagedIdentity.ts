import { DID, DIDProvider } from "dids";
import { Resource } from "@daemon-land/types";
import Ceramic from "@ceramicnetwork/http-client";
import ThreeIDResolver from "@ceramicnetwork/3id-did-resolver";

import { AccessController, Profile } from "../SDKWrappers";
import { generateReturnURL, signAsPDM } from "../../utils";

export default class ManagedIdentity {
  private _didProvider: DIDProvider | null = null;
  public url: string = "";
  public ceramicUrl: string;
  public appToken: string = "";
  public profile: Profile;
  public permissions: AccessController;
  constructor(
    didProvider: DIDProvider,
    opts?: Partial<{ url: string; ceramicUrl: string; sessionToken: string }>
  ) {
    if (!didProvider)
      throw new Error("Must pass ThreeID instance to ManagedIdentity");
    this.url = opts?.url || "http://locahost:3001";
    this.ceramicUrl = opts?.ceramicUrl || "http://localhost:7007";
    this.appToken = opts?.sessionToken || "";
    this._didProvider = didProvider;
    this.profile = new Profile(didProvider, opts);
    this.permissions = new AccessController(didProvider, opts);
  }

  get didProvider() {
    return this._didProvider;
  }

  get authenticated() {
    return !!this.appToken;
  }

  static async create(
    didProvider: DIDProvider,
    opts?: Partial<{ url: string; ceramicUrl: string; sessionToken: string }>
  ): Promise<ManagedIdentity> {
    let token = opts?.sessionToken;
    if (!token) {
      const ceramic = new Ceramic(
        opts?.ceramicUrl || process.env.NEXT_PUBLIC_CERAMIC_URL
      );

      try {
        // here we have the user sign a message,
        // so that on the server side, the PDM backend can verify the DID it is about to sign
        // is being requested by the owner of the DID (i.e. you can't ask the PDM to sign someone else's DID for you)
        await ceramic.setDIDProvider(didProvider);
        const resolver = ThreeIDResolver.getResolver(ceramic);
        const signer = new DID({ provider: didProvider, resolver });
        await signer.authenticate();
        const jws = await signer.createJWS({
          operandDID: signer.id,
        });
        token = await signAsPDM(signer.id, jws);
      } finally {
        await ceramic.close();
      }
    }
    return new ManagedIdentity(didProvider, {
      sessionToken: token,
      ...opts,
    });
  }

  async did() {
    const ceramic = new Ceramic(this.ceramicUrl);
    try {
      await ceramic.setDIDProvider(this.didProvider!);
      const resolver = ThreeIDResolver.getResolver(ceramic);
      const signer = new DID({ provider: this.didProvider!, resolver });
      await signer.authenticate();
      return signer.id;
    } finally {
      await ceramic.close();
    }
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
