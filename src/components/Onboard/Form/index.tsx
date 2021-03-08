import { SyntheticEvent } from "react";
import PropTypes from "prop-types";
import { Button, Box, Text } from "@glif/react-components";

import { SignInEmailForm, SignUpEmailForm } from "./EmailForm";
import { PropTypeView, View } from "../View";

type OnboardFormProps = {
  view: View;
  onEmailSubmit: (event: SyntheticEvent) => void;
  onWeb3Connect: () => void;
};

function SignInView(props: {
  onEmailSubmit: (event: SyntheticEvent) => void;
  onWeb3Connect: () => void;
}) {
  return (
    <>
      <Box
        display="flex"
        width="100%"
        justifyContent="space-between"
        flexWrap="wrap"
        mb={3}
      >
        <Text color="core.nearblack" textAlign="center" p="0" m={0} mr={1}>
          SIGN IN
        </Text>
      </Box>
      <SignInEmailForm onEmailSubmit={props.onEmailSubmit} />
      <Text color="core.darkgray" textAlign="left" p="0" m={0} my={3}>
        - OR -
      </Text>
      <Button
        role="button"
        title="Connect with Web3"
        onClick={props.onWeb3Connect}
      />
    </>
  );
}

function SignUpView(props: {
  onEmailSubmit: (event: SyntheticEvent) => void;
  onWeb3Connect: () => void;
}) {
  return (
    <>
      <Box
        display="flex"
        width="100%"
        justifyContent="space-between"
        flexWrap="wrap"
        mb={3}
      >
        <Text color="core.nearblack" textAlign="center" p="0" m={0} mr={1}>
          SIGN UP
        </Text>
      </Box>
      <SignUpEmailForm onEmailSubmit={props.onEmailSubmit} />
      <Text color="core.darkgray" textAlign="left" p="0" m={0} my={3}>
        - OR -
      </Text>
      <Button
        role="button"
        title="Connect with Web3"
        onClick={props.onWeb3Connect}
      />
    </>
  );
}

export default function OnboardForm(props: OnboardFormProps) {
  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        p={3}
        mt={[5, 0, 0]}
        minHeight={10}
        alignItems="center"
        justifyContent="center"
        borderRadius={2}
        bg="background.screen"
      >
        {props.view === "SIGN_IN" ? (
          <SignInView
            onEmailSubmit={props.onEmailSubmit}
            onWeb3Connect={props.onWeb3Connect}
          />
        ) : (
          <SignUpView
            onEmailSubmit={props.onEmailSubmit}
            onWeb3Connect={props.onWeb3Connect}
          />
        )}
      </Box>
    </>
  );
}

OnboardForm.propTypes = {
  onWeb3Connect: PropTypes.func.isRequired,
  onEmailSubmit: PropTypes.func.isRequired,
  view: PropTypeView,
};
