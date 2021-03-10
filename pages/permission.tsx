import type { GetServerSidePropsContext } from "next";
import axios from "axios";
import type { PermissionRequestV2, Resource } from "@daemon-land/types";
import PermissionRequest from "../src/components/PermissionRequest";
import {
  MinimalProfile,
  PermissionPageProps,
  PermissionPagePropType,
} from "../src/PropTypes";

export default function Permission(props: PermissionPageProps) {
  return <PermissionRequest {...props} />;
}

Permission.propTypes = PermissionPagePropType;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  let invalidParamsErr = false;
  // check to make sure all valid permissionRequest params are included
  ["requesterDID", "resource", "permission"].forEach((p) => {
    if (!context.query[p]) invalidParamsErr = true;
    // TODO - here we could check deeper into the params to ensure they fit the right critera (i.e. resource is a valid resource, requesterDID is a valid DID...etc)
  });

  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_DL_URL}/v0/identity/profile/${context.query.requesterDID}`
  );

  if (invalidParamsErr || res.status !== 200) {
    return {
      props: {
        permissionRequest: null,
        invalidParamsErr,
        profile: null,
      },
    };
  }

  const permissionRequest: PermissionRequestV2 = {
    requesterDID: context.query.requesterDID as string,
    resource: context.query.resource as Resource,
    permission: Number(context.query.permission) as number,
    state: (context.query.state as string) || "",
    // TODO: add datastore stuff here
  };

  return {
    props: {
      permissionRequest,
      invalidParamsErr,
      profile: res.data as MinimalProfile,
    },
  };
}
