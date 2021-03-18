import React, { Dispatch, SetStateAction, useState } from "react";
import ThreeID from "3id-did-provider";
import Image from "next/image";
import PropTypes from "prop-types";
import axios from "axios";
import { useRouter } from "next/router";
import { Box, Button, Text } from "@glif/react-components";
import { PermissionRequestV2, SpiritProfile } from "@daemon-land/types";
import styled from "styled-components";
import ReviewCardHeader from "./ReviewCardHeader";
import {
  useManagedIdentityProvider,
  useWeb2IdentityProvider,
} from "../../../contexts";
import EnterPassword from "../EnterPassword/Input";
import {
  AuthenticationStatus,
  MinimalProfilePropType,
  PermissionRequestV2PropType,
} from "../../../PropTypes";

const Form = styled.form`
  width: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
`;

export default function PermissionForm(props: {
  permissionRequest: PermissionRequestV2;
  sessionToken: string;
  profile: SpiritProfile;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  landingState: AuthenticationStatus;
}) {
  const router = useRouter();
  const {
    web2IdentitySingleton,
    createWeb2IdentitySingleton,
  } = useWeb2IdentityProvider();
  const { createManagedIdentitySingleton } = useManagedIdentityProvider();
  const [err, setErr] = useState<string>("");

  const addPermission = async (did: ThreeID) => {
    // TODO - try catch these and set friendly errors, gracefully fail
    const managedIdentity = await createManagedIdentitySingleton!(did);
    await managedIdentity.permissions.add({
      did: props.permissionRequest.requesterDID,
      permission: props.permissionRequest.permission,
      resource: props.permissionRequest.resource,
    });
    const returnURL = await managedIdentity.generateReturnURL(
      props.permissionRequest.requesterDID,
      props.permissionRequest.permission,
      props.permissionRequest.resource,
      router.query?.state as string
    );
    alert(returnURL);
    // router.push(returnURL);
  };

  return (
    <Box display="flex" flexDirection="column" width="100%" mt={2}>
      <Form
        onSubmit={async (e) => {
          e.preventDefault();
          // by the time you got here, all you have to do is accept the request
          // we already have your password
          if (props.landingState !== "ACTIVE_SESSION_LANDING") {
            if (!web2IdentitySingleton) {
              setErr(
                "Hmmm something is not right. Please refresh the page and try again."
              );
              return;
            }
            await addPermission(web2IdentitySingleton?.did!);
            return;
          }

          // this means you still have to enter your password and login first to grant the permission
          if (props.step === 1) {
            props.setStep(2);
            return;
          }

          // you already entered your password and we created an identity singleton
          const { elements } = e.target as HTMLFormElement;
          const password = elements.namedItem("password") as HTMLInputElement;

          const res = await axios.get(
            `${process.env.NEXT_PUBLIC_DL_URL}/v0/identity`,
            {
              headers: {
                Authorization: `Bearer ${props.sessionToken}`,
              },
            }
          );
          if (res.status !== 200) {
            setErr(
              "There was an error accepting your permission request! Sorry for the holdup."
            );
            return;
          }
          const web2Identity = createWeb2IdentitySingleton!(
            res.data.username,
            password.value
          );
          await web2Identity.login();
          await addPermission(web2Identity?.did!);
          return;
        }}
      >
        <Box
          maxWidth={13}
          width="100%"
          minWidth={11}
          display="flex"
          flex="1"
          flexDirection="column"
          justifyContent="flex-start"
        >
          <Box boxShadow={2} borderRadius={4}>
            <ReviewCardHeader />
            <Box
              width="100%"
              css={`
                padding: 16px 70px;
              `}
              border={0}
              bg="background.screen"
              borderRadius={3}
            >
              <Box
                display="flex"
                flexDirection="column"
                flex="1"
                justifyContent="center"
                margin="auto"
                maxWidth={13}
                width="100%"
                minWidth={11}
                maxHeight={12}
                my={3}
                borderRadius={1}
              >
                {props.landingState === "ACTIVE_SESSION_LANDING" &&
                props.step === 2 ? (
                  <>
                    <Text textAlign="center">
                      Enter your password to grant this permission and return to{" "}
                      {props.profile.name}!
                    </Text>
                    <EnterPassword error={err} />
                  </>
                ) : (
                  <>
                    {/* TODO: actually decode permission request */}
                    <Box display="flex" justifyContent="center">
                      <Image
                        src={props.profile.imageUrl!}
                        width="100px"
                        height="100px"
                      />
                    </Box>
                    <Text textAlign="center">
                      {props.profile.name} is requesting to your view your
                      profile. Click "Accept" below to grant this permission.
                    </Text>
                  </>
                )}
              </Box>
            </Box>
          </Box>
          <Box
            display="flex"
            flex="1"
            flexDirection="row"
            justifyContent="center"
            margin="auto"
            maxWidth={13}
            width="100%"
            minWidth={11}
            maxHeight={12}
            my={7}
          >
            <Button
              variant="primary"
              title={
                props.landingState === "ACTIVE_SESSION_LANDING" &&
                props.step === 2
                  ? "Submit"
                  : "Accept"
              }
              type="submit"
            />
          </Box>
        </Box>
      </Form>
    </Box>
  );
}

PermissionForm.propTypes = {
  permissionRequest: PermissionRequestV2PropType,
  sessionToken: PropTypes.string.isRequired,
  profile: MinimalProfilePropType,
  step: PropTypes.number.isRequired,
  landingState: PropTypes.string.isRequired,
  setStep: PropTypes.func.isRequired,
};
