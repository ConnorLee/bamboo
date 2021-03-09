import { SyntheticEvent } from "react";
import PropTypes from "prop-types";
import { Button, Box, Text } from "@glif/react-components";
import SignInEmailForm from "./SignInEmailForm";

export default function SignInView(props: {
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
        variant="secondary"
        onClick={props.onWeb3Connect}
      />
    </>
  );
}

SignInView.propTypes = {
  onWeb3Connect: PropTypes.func.isRequired,
  onEmailSubmit: PropTypes.func.isRequired,
};
