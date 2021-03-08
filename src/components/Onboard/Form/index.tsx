import { SyntheticEvent } from "react";
import PropTypes from "prop-types";
import { Button, Box, Text } from "@glif/react-components";

import EmailForm from "./EmailForm";

type OnboardFormProps = {
  onEmailSubmit: (event: SyntheticEvent) => void;
  onWeb3Connect: () => void;
};

export default function OnboardForm(props: OnboardFormProps) {
  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        p={3}
        mt={[5, 0, 0]}
        minHeight={10}
        width="100%"
        maxWidth={13}
        alignItems="center"
        justifyContent="center"
        borderRadius={2}
        bg="background.screen"
      >
        <Box
          display="flex"
          width="100%"
          justifyContent="space-between"
          flexWrap="wrap"
          mb={3}
        >
          <Text color="core.nearblack" textAlign="center" p="0" m={0} mr={1}>
            SIGN IN/UP
          </Text>
        </Box>
        <EmailForm onEmailSubmit={props.onEmailSubmit} />
        <Text color="core.darkgray" textAlign="left" p="0" m={0} my={3}>
          - OR -
        </Text>
        <Button
          role="button"
          title="Connect with Web3"
          onClick={props.onWeb3Connect}
        />
      </Box>
    </>
  );
}

OnboardForm.propTypes = {
  onWeb3Connect: PropTypes.func.isRequired,
  onEmailSubmit: PropTypes.func.isRequired,
};
