import { AccessController } from "@daemon-land/sdk";
import { CreatePermissionV2Config, PermissionDoc } from "@daemon-land/types";
import { DIDProvider } from "dids";

export default class AccessControllerWrapper extends AccessController {
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

  async add(config: CreatePermissionV2Config): Promise<PermissionDoc> {
    return super.add(config);
  }
}
