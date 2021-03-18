import ThreeID from "3id-did-provider";
import { Resource } from "@daemon-land/types";
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
      token = await signAsPDM(did.id);
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
