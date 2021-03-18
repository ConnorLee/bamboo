import React, { SyntheticEvent, useState } from "react";
import axios from "axios";
import IPFS from "ipfs-http-client";
import {
  Box,
  Button,
  Label,
  Text,
  Input,
  StyledATag,
  ButtonClose,
} from "@glif/react-components";
import styled from "styled-components";
import CardHeader from "./CardHeader";
import Dropzone from "./Dropzone";
import {
  useManagedIdentityProvider,
  useWeb2IdentityProvider,
  useJwt,
} from "../../../contexts";
import EnterPassword from "../../PermissionRequest/EnterPassword/Input";

const Form = styled.form`
  width: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
`;

export default function CreateAppProfile() {
  const [appName, setAppName] = useState<string>("");
  const [callbackUrl, setCallbackUrl] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [inputPassword, setInputPassword] = useState<boolean>(false);
  const [err, setErr] = useState<string>("");
  const [creating3ID, setCreating3ID] = useState<boolean>(false);
  const { get, remove } = useJwt();
  const {
    createWeb2IdentitySingleton,
    web2IdentitySingleton,
  } = useWeb2IdentityProvider();
  const { createManagedIdentitySingleton } = useManagedIdentityProvider();

  return (
    <Box display="flex" flexDirection="column" width="100%" mt={8}>
      <Form
        onSubmit={async (e: SyntheticEvent) => {
          e.preventDefault();
          if (creating3ID) return;
          setErr("");
          if (!appName || !callbackUrl || !imageUrl) {
            setErr("Please complete all form fields");
            return;
          }

          const { elements } = e.target as HTMLFormElement;
          const password = elements.namedItem("password") as HTMLInputElement;
          if (!web2IdentitySingleton && !password) {
            setInputPassword(true);
            return;
          } else if (!web2IdentitySingleton) {
            try {
              setCreating3ID(true);
              // TODO is this call secure?
              const res = await axios.get(
                `${process.env.NEXT_PUBLIC_DL_URL}/v0/identity`,
                {
                  headers: {
                    Authorization: `Bearer ${get("SESSION")}`,
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
              const managedIdentity = await createManagedIdentitySingleton!(
                web2Identity.did!
              );
              await managedIdentity.profile.create({
                name: appName,
                imageUrl,
                callbackUrl,
              });
              setCreating3ID(false);
              alert(
                `Your application ${appName} has been created successfully. Your app DID is: ${web2Identity.did?.id}`
              );
              // TODO: remove this hack - just to log out the user after they've created their app
              remove("SESSION");
            } catch (err) {
              setCreating3ID(false);
              setErr(err.message);
              return;
            }
          } else {
            try {
              setCreating3ID(true);
              const managedIdentity = await createManagedIdentitySingleton!(
                web2IdentitySingleton.did!
              );
              await managedIdentity.profile.create({
                name: appName,
                imageUrl,
                callbackUrl,
              });
              setCreating3ID(false);
              alert(
                `Your application ${appName} has been created successfully. Your app DID is: ${web2IdentitySingleton.did?.id}`
              );
              // TODO: remove this hack - just to log out the user after they've created their app
              remove("SESSION");
            } catch (err) {
              setCreating3ID(false);
              setErr(err.message);
              return;
            }
          }
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
          <CardHeader />
          <Box width="100%" p={3} border={0} bg="background.screen">
            {creating3ID && (
              <Text textAlign="center">
                Creating your decentralized identity... hold on tight!
              </Text>
            )}
            {!creating3ID ? (
              inputPassword ? (
                <>
                  <Text textAlign="center">
                    Enter your password to register your application!
                  </Text>
                  <EnterPassword error={err} />
                </>
              ) : (
                <>
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
                    <Input.Text
                      label="App name"
                      placeholder="Instagram V2"
                      value={appName}
                      onChange={(e: SyntheticEvent) => {
                        const target = e.target as HTMLInputElement;
                        setAppName(target.value);
                      }}
                      mb={3}
                    />
                    <Input.Text
                      label="Callback"
                      placeholder="http://localhost:3000/callback"
                      value={callbackUrl}
                      onChange={(e: SyntheticEvent) => {
                        const target = e.target as HTMLInputElement;
                        setCallbackUrl(target.value);
                      }}
                    />
                    {imageUrl ? (
                      <Box mt={5} alignItems="center">
                        <StyledATag
                          href={imageUrl}
                          target="_blank"
                          rel="nooppener noreferrer"
                        >
                          Check out your application image
                        </StyledATag>
                        <ButtonClose onClick={() => setImageUrl("")} />
                      </Box>
                    ) : (
                      <Dropzone
                        fileCB={async (file) => {
                          const ipfs = IPFS({
                            url: process.env.NEXT_PUBLIC_IPFS_API_URL,
                          });
                          if (file) {
                            const { cid } = await ipfs.add(file, {
                              pin: true,
                            });
                            setImageUrl(
                              `${
                                process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL
                              }/${cid.toBaseEncodedString()}`
                            );
                          }
                        }}
                      />
                    )}
                  </Box>
                  {err && (
                    <Box pt={0} mx={0} textAlign="center" minHeight={6} mt={3}>
                      <Label color="status.fail.background" m={0}>
                        {err}
                      </Label>
                    </Box>
                  )}
                </>
              )
            ) : null}
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
            <Button
              variant="primary"
              title="Register"
              type="submit"
              disabled={creating3ID}
            />
          </Box>
        </Box>
      </Form>
    </Box>
  );
}
