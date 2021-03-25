import { Profile } from "@daemon-land/sdk";
import { SpiritProfile } from "@daemon-land/types";
import { DIDProvider } from "dids";

export default class ProfileWrapper extends Profile {
  private _didProvider: DIDProvider | null = null;
  public ceramicUrl: string;

  constructor(
    didProvider: DIDProvider,
    opts?: Partial<{ url: string; sessionToken: string; ceramicUrl: string }>
  ) {
    super({ sessionToken: opts?.sessionToken, serviceUrl: opts?.url });
    if (!didProvider)
      throw new Error("Must pass DIDProvider instance to Profile");
    this.ceramicUrl = opts?.ceramicUrl || "http://localhost:7007";
    this._didProvider = didProvider;
  }

  async create(profile: SpiritProfile) {
    return super.create(profile);
  }
}
