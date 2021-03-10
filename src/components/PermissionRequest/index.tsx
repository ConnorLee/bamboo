import React, { useEffect, useState } from "react";
import { useJwt } from "../../contexts";
import Onboard from "./Onboard";
import PermissionForm from "./PermissionForm";
import { PermissionPagePropType, PermissionPageProps } from "../../PropTypes";

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

  if (!props.profile) return <div>Invalid requesterDID</div>;

  return (
    <>
      {loggedIn ? (
        <PermissionForm
          sessionToken={get("SESSION")!}
          permissionRequest={props.permissionRequest}
          profile={props.profile}
        />
      ) : (
        <Onboard setLoggedIn={setLoggedIn} />
      )}
    </>
  );
}

PermissionRequest.propTypes = PermissionPagePropType;
