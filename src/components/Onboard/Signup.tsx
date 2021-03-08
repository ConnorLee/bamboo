import React, { useState, SyntheticEvent } from "react";
import { Box, Title, Header, HeaderGlyph } from "@glif/react-components";
import { useIdentityProvider } from "../../IdentityProvider";
import OnboardForm from "./Form";

export default function Signup() {
  const { createIdentitySingleton } = useIdentityProvider();

  return (
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
            Bring your identity and data with you to the apps you use. Apps must
            request your permission to read your data and add to it.
          </Title>
        </Box>
      </Box>

      <OnboardForm
        onEmailSubmit={async (e: React.FormEvent) => {
          e.preventDefault();
          const { elements } = e.target as HTMLFormElement;
          const email = elements.namedItem("email") as HTMLInputElement;
          const password = elements.namedItem("password") as HTMLInputElement;
          const identitySingleton = createIdentitySingleton!(
            email.value,
            password.value
          );
          const threeID = await identitySingleton.signup();
          console.log(threeID);
        }}
        onWeb3Connect={() => {
          console.log("Clicked web3 connect!");
        }}
      />
    </Box>
  );
}
