import PropTypes from "prop-types";
import React from "react";
import styled from "styled-components";
import { Box, Text } from "@glif/react-components";

export type View = "SIGN_IN" | "SIGN_UP" | "VERIFY_EMAIL" | "ENTER_PASSWORD";

export const PropTypeView = PropTypes.oneOf([
  "SIGN_IN",
  "SIGN_UP",
  "VERIFY_EMAIL",
  "ENTER_PASSWORD",
]).isRequired;

const HoverableLink = styled(Text)`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export default function SwitchView(props: {
  view: View;
  onSwitch: (view: View) => void;
}) {
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
