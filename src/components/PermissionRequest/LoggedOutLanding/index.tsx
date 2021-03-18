import React, { useState } from "react";
import { Box, Title, Header, HeaderGlyph } from "@glif/react-components";
import { SpiritProfile } from "@daemon-land/types";
import PropTypes from "prop-types";
import Form from "./Form";

/** This component gets rendered when the user is logged out of the PDM OR has never signed up before */
export default function LoggedOutLanding(props: { profile: SpiritProfile }) {
  const [view, setView] = useState<"SIGN_IN" | "SIGN_UP" | "">("");
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
          <Header fontSize={6} lineHeight={1}>
            Login to {props.profile.name} with your decentralized identity
          </Header>
          <Title mt={3} lineHeight="140%" color="core.darkgray">
            Decentralized identities (DIDs) are accounts you own and control.
            They aren't tied to an app or company. Bring your identities, data,
            and friends to any app that supports DIDs.
          </Title>
        </Box>
      </Box>
      <Form setView={setView} view={view} />
    </Box>
  );
}

LoggedOutLanding.propTypes = {
  profile: PropTypes.object.isRequired,
};
