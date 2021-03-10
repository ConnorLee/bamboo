import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Button, Title, Text } from "@glif/react-components";
import { PermissionRequestV2 } from "@daemon-land/types";
import styled from "styled-components";
import CardHeader from "./CardHeader";
import { useIdentityProvider } from "../../../contexts";
import EnterPassword from "./EnterPassword";

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
}) {
  const { identitySingleton, createIdentitySingleton } = useIdentityProvider();
  const [err, setErr] = useState<string>("");
  const [inputPassword, setInputPassword] = useState<boolean>(false);

  return (
    <Box display="flex" flexDirection="column" width="100%" mt={8}>
      <Form
        onSubmit={async (e) => {
          e.preventDefault();
          const { elements } = e.target as HTMLFormElement;
          const password = elements.namedItem("password") as HTMLInputElement;

          // user has session but no password entered yet
          if (!identitySingleton && !password) {
            setInputPassword(true);
            return;
          } else if (!identitySingleton) {
            try {
              // TODO is this call secure?
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
              const identitySingleton = createIdentitySingleton!(
                res.data.username,
                password.value
              );
              await identitySingleton.login();
              await identitySingleton.savePermission(props.permissionRequest);
              const callbackURL = await identitySingleton.generateCallback(
                props.permissionRequest.requesterDID
              );
            } catch (err) {
              setErr(err.message);
            }
          } else {
            await identitySingleton.savePermission(props.permissionRequest);
            const callbackURL = await identitySingleton.generateCallback(
              props.permissionRequest.requesterDID
            );
          }
          // SAVE TO IDX HERE
          // UPDATE CACHE
          // NEED TO CHECK IF WE HAVE THE ENCRYPTION KEY ALREADY // HAVE AUTHED WITH SERVER, IF NOT, POP OPEN PASSWORD DIALAUGE
          alert("Routing you back to calling application!");
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
          <CardHeader
            from={props.permissionRequest.requesterDID}
            resource={props.permissionRequest.resource}
            permission={props.permissionRequest.permission}
          />
          <Box width="100%" p={3} border={0} bg="background.screen">
            <Title fontSize={4} textAlign="center">
              PERMISSION REQUEST
            </Title>
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
            >
              {inputPassword ? (
                <>
                  <Text textAlign="center">
                    Enter your password to grant this permission and return to{" "}
                    {props.permissionRequest.requesterDID}!
                  </Text>
                  <EnterPassword error={err} />
                </>
              ) : (
                <>
                  {/* TODO: actually decode permission request */}
                  <Text textAlign="center">
                    {props.permissionRequest.requesterDID} is requesting READ
                    access to your Profile. Click the "Accept" button below to
                    grant this permission.
                  </Text>
                  <Text textAlign="center" color="core.darkgray">
                    If this was a mistake, you can exit this page and do
                    nothing!
                  </Text>
                </>
              )}
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
            my={3}
          >
            <Button variant="primary" title="Accept" type="submit" />
          </Box>
        </Box>
      </Form>
    </Box>
  );
}
