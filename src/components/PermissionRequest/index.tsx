import React, { useEffect, useState } from "react";
import type { PermissionRequestV2 } from "@daemon-land/types";
import { bool } from "prop-types";
import { Box } from "@glif/react-components";
import { useJwt } from "../../contexts";
import Onboard from "./Onboard";
import PermissionForm from "./PermissionForm";
import { PermissionRequestV2PropType } from "../../PropTypes";

type PermissionPageProps = {
  permissionRequest: PermissionRequestV2 | null;
  invalidParamsErr: boolean;
};

export default function PermissionRequest(props: PermissionPageProps) {
  const { get } = useJwt();
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const sessionJWT = get("SESSION");
    if (sessionJWT) setLoggedIn(true);
  }, [get, setLoggedIn]);

  // TODO - make this invalid params error into a proper page
  if (props.invalidParamsErr || !props.permissionRequest)
    return <div>Invalid params error</div>;

  return (
    <>
      {loggedIn ? (
        <PermissionForm
          sessionToken={get("SESSION")!}
          permissionRequest={props.permissionRequest}
        />
      ) : (
        <Onboard setLoggedIn={setLoggedIn} />
      )}
    </>
  );
}

PermissionRequest.propTypes = {
  permissionRequest: PermissionRequestV2PropType,
  invalidParamsErr: bool.isRequired,
};
