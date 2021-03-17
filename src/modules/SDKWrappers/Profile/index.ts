import { Profile } from "@daemon-land/sdk";
import ThreeID from "3id-did-provider";
import { SpiritProfile } from "@daemon-land/types";

export default class ProfileWrapper extends Profile {
  private _did: ThreeID | null = null;
  public ceramicUrl: string;

  constructor(
    did: ThreeID,
    opts?: Partial<{ url: string; sessionToken: string; ceramicUrl: string }>
  ) {
    super({ sessionToken: opts?.sessionToken, serviceUrl: opts?.url });
    if (!did) throw new Error("Must pass ThreeID instance to Profile");
    this.ceramicUrl = opts?.ceramicUrl || "http://localhost:7007";
    this._did = did;
  }

  async create(profile: SpiritProfile) {
    return super.create(profile);
  }
}
