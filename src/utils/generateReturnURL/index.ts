import { Resource } from "@daemon-land/sdk";
import axios from "axios";

/* Tests for this function are in "ManagedIdentity" */
export default async function generateReturnURL(
  requesterDID: string,
  permission: number,
  resource: Resource,
  appToken: string,
  url: string,
  state: string = ""
) {
  try {
    const res = await axios.post(
      `${url}/v0/pkce/generate-return-url`,
      {
        requesterDID,
        // TODO PKCE:
        code_challenge: "",
        permission,
        resource,
        state,
      },
      {
        headers: {
          Authorization: `Bearer ${appToken}`,
        },
      }
    );

    if (res.status !== 201) throw new Error("Error generating returnURL");

    return res.data.returnURL as string;
  } catch (err) {
    throw new Error(err.response.data);
  }
}
