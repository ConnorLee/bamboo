import React, { SyntheticEvent, useEffect, useState } from "react";
import axios from "axios";
import IPFS from "ipfs-http-client";
import {
  Box,
  Button,
  Title,
  Text,
  Input,
  StyledATag,
  ButtonClose,
} from "@glif/react-components";
import { PermissionRequestV2 } from "@daemon-land/types";
import styled from "styled-components";
import CardHeader from "./CardHeader";
import Dropzone from "./Dropzone";
import { useIdentityProvider } from "../../../contexts";

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
  return (
    <Box display="flex" flexDirection="column" width="100%" mt={8}>
      <Form
        onSubmit={(e: SyntheticEvent) => {
          e.preventDefault();
          console.log(appName, callbackUrl, imageUrl);
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
            <Button variant="primary" title="Register" type="submit" />
          </Box>
        </Box>
      </Form>
    </Box>
  );
}
