import { SyntheticEvent } from "react";
import PropTypes from "prop-types";
import { Button, Box, Text } from "@glif/react-components";
import SignInEmailForm from "./SignInEmailForm";

export default function SignInView(props: {
  onSubmit: (event: SyntheticEvent) => void;
  error?: string;
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
      <SignInEmailForm onSubmit={props.onSubmit} error={props.error} />
    </>
  );
}

SignInView.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  error: PropTypes.string,
};

SignInView.defaultProps = {
  error: "",
};
