import { SyntheticEvent } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Box,
  Text,
  Title,
  Card,
  InputLabelBase,
  Input,
} from "@glif/react-components";
import SignUpEmailForm from "./SignUpEmailForm";
import { PropTypeView, View } from "../../PermissionRequest/View";

export default function SignUpView(props: {
  onPasswordSubmit: (event: SyntheticEvent) => void;
  onEmailSubmit: (event: SyntheticEvent) => void;
  view: View;
  error?: string;
  creating3ID: boolean;
}) {
  if (props.creating3ID) {
    return (
      <Title>Creating your decentralized identity... hold tight! 🚀🚀🚀</Title>
    );
  }

  if (props.view === "VERIFY_EMAIL") {
    return <Title>Check your email!</Title>;
  }

  if (props.view === "ENTER_PASSWORD") {
    return (
      <>
        <Text
          color="core.nearblack"
          textAlign="center"
          p="0"
          m={0}
          mr={1}
          mb={1}
        >
          Choose something non-obvious, please!
        </Text>
        <Card
          p={0}
          border={0}
          width="100%"
          maxWidth={13}
          height={7}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          boxShadow={2}
          bg="status.success.background"
        >
          <Box
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            flexWrap="wrap"
            height="100%"
          >
            <form
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                flexGrow: 1,
              }}
              onSubmit={props.onPasswordSubmit}
            >
              <Box
                position="relative"
                display="flex"
                flexGrow="1"
                flexWrap="wrap"
                alignItems="center"
                height="100%"
              >
                <InputLabelBase display="none" htmlFor="password" />
                <Input.Base
                  id="password"
                  width="100%"
                  pr={8}
                  overflow="scroll"
                  placeholder="Strong password"
                  pl={3}
                  type="password"
                  height="100%"
                  flexShrink="1"
                />
                <Button
                  position="absolute"
                  right="0"
                  mx={2}
                  px={4}
                  type="submit"
                  title="Sign up"
                />
              </Box>
            </form>
          </Box>
        </Card>
      </>
    );
  }

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
      <SignUpEmailForm
        onEmailSubmit={props.onEmailSubmit}
        error={props.error}
      />
    </>
  );
}

SignUpView.propTypes = {
  onEmailSubmit: PropTypes.func.isRequired,
  onPasswordSubmit: PropTypes.func.isRequired,
  view: PropTypeView,
  error: PropTypes.string,
  creating3ID: PropTypes.bool.isRequired,
};

SignUpView.defaultProps = {
  error: "",
};
