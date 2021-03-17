import { AccessController } from "@daemon-land/sdk";
import ThreeID from "3id-did-provider";
import { CreatePermissionV2Config, PermissionDoc } from "@daemon-land/types";

export default class AccessControllerWrapper extends AccessController {
  private _did: ThreeID | null = null;
  public ceramicUrl: string;

  constructor(
    did: ThreeID,
    opts?: Partial<{ url: string; sessionToken: string; ceramicUrl: string }>
  ) {
    super({ sessionToken: opts?.sessionToken, serviceUrl: opts?.url });
    if (!did) throw new Error("Must pass ThreeID instance to AccessController");
    this.ceramicUrl = opts?.ceramicUrl || "http://localhost:7007";
    this._did = did;
  }

  async add(config: CreatePermissionV2Config): Promise<PermissionDoc> {
    return super.add(config);
  }
}
