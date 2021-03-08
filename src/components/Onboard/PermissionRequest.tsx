import React, { useState } from "react";
import {
  Box,
  Title,
  Header,
  HeaderGlyph,
  Text,
  StyledATag,
} from "@glif/react-components";
import styled from "styled-components";
import axios from "axios";
import { useIdentityProvider, useJwt } from "../../contexts";
import { View } from "./View";
import OnboardForm from "./Form";

const HoverableLink = styled(Text)`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

function SwitchView(props: { view: View; onSwitch: (view: View) => void }) {
  return (
    <>
      {props.view === "SIGN_IN" ? (
        <Box display="flex">
          <Text color="core.darkgray" p="0" m={0} my={3} mr={2}>
            Don't have an account yet?
          </Text>
          <HoverableLink
            color="core.primary"
            p="0"
            m={0}
            my={3}
            onClick={() => props.onSwitch("SIGN_UP")}
          >
            Create one
          </HoverableLink>
        </Box>
      ) : (
        <Box display="flex">
          <Text color="core.darkgray" p="0" m={0} my={3} mr={2}>
            Already have an account?
          </Text>
          <HoverableLink
            color="core.primary"
            p="0"
            m={0}
            my={3}
            onClick={() => props.onSwitch("SIGN_IN")}
          >
            Sign in
          </HoverableLink>
        </Box>
      )}
    </>
  );
}

export default function Onboard() {
  const [view, setView] = useState<View>("SIGN_IN");
  const { get, set } = useJwt();
  const { createIdentitySingleton } = useIdentityProvider();
  const [err, setErr] = useState<string>("");
  return (
    <>
      <Box
        position="relative"
        display="flex"
        flexWrap="wrap"
        minHeight="90vh"
        alignItems="center"
        justifyContent="space-evenly"
        flexGrow="1"
        p={[2, 3, 5]}
      >
        <Box
          display="flex"
          maxWidth={13}
          width={["100%", "100%", "40%"]}
          flexDirection="column"
          alignItems="flex-start"
          alignContent="center"
          mb={4}
        >
          <HeaderGlyph
            alt="Source: https://unsplash.com/photos/g2Zf3hJyYAc"
            text="Identity"
            imageUrl="/imgverify.png"
            color="white"
            fill="white"
          />
          <Box
            display="flex"
            flexDirection="column"
            mt={[2, 4, 4]}
            alignSelf="center"
            textAlign="left"
          >
            <Header lineHeight={1}>Decentralized identity management</Header>
            <Title mt={3} lineHeight="140%">
              Bring your identity and data with you to the apps you use. Apps
              must request your permission to read your data and add to it.
            </Title>
          </Box>
        </Box>
        <Box width="100%" maxWidth={13}>
          <OnboardForm
            view={view}
            // TODO: add email error feedback here
            onEmailSubmit={async (e: React.FormEvent) => {
              e.preventDefault();
              const { elements } = e.target as HTMLFormElement;
              const email = elements.namedItem("email") as HTMLInputElement;
              const res = await axios.post(
                `${process.env
                  .NEXT_PUBLIC_DL_URL!}/v0/verifications/email/send`,
                {
                  email: email.value,
                }
              );

              if (res.status !== 201)
                return setErr(
                  "Whoops! There was an error sending you a verification email. Please come back tomorrow and try again."
                );

              // const password = elements.namedItem("password") as HTMLInputElement;
              // const identitySingleton = createIdentitySingleton!(
              //   email.value,
              //   password.value
              // );
              // const threeID = await identitySingleton.signup();
              // console.log(threeID);
            }}
            onWeb3Connect={() => {
              console.log("Clicked web3 connect!");
            }}
          />
          <SwitchView view={view} onSwitch={(view: View) => setView(view)} />
        </Box>
      </Box>
    </>
  );
}
