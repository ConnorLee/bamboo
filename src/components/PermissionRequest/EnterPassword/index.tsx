import { Box, Button, Form, Glyph, Text } from "@glif/react-components";
import { SyntheticEvent } from "react";
import PropTypes from "prop-types";
import EnterPasswordInput from "./Input";

export default function EnterPassword(props: {
  onPasswordSubmit: (e: SyntheticEvent) => Promise<void>;
}) {
  return (
    <Box display="flex" flexDirection="column" width="100%" mt={2}>
      <Form onSubmit={props.onPasswordSubmit}>
        <Box
          maxWidth={13}
          width="100%"
          minWidth={11}
          display="flex"
          flex="1"
          flexDirection="column"
          justifyContent="center"
        >
          <Box boxShadow={2} borderRadius={4}>
            <Box
              width="100%"
              p={3}
              border={0}
              borderTopRightRadius={3}
              borderTopLeftRadius={3}
              bg="core.primary"
              color="core.white"
            >
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box display="flex" flexDirection="row" alignItems="center">
                  <Glyph acronym="Sp" color="white" mr={3} />
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="flex-start"
                  >
                    <Text m={0}>Select your password</Text>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box width="100%" p={3} border={0} bg="background.screen">
              <EnterPasswordInput error="" />
            </Box>
          </Box>
          <Button
            width={8}
            mt={7}
            alignSelf="center"
            variant="primary"
            title="Save"
            type="submit"
            onClick={() => {}}
          />
        </Box>
      </Form>
    </Box>
  );
}

EnterPassword.propTypes = {
  onPasswordSubmit: PropTypes.func.isRequired,
};
