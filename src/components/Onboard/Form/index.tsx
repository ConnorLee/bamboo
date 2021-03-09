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

import { SignInEmailForm, SignUpEmailForm } from "./EmailForm";
import { PropTypeView, View } from "../View";

type OnboardFormProps = {
  view: View;
  onEmailSubmit: (event: SyntheticEvent) => void;
  onWeb3Connect: () => void;
  onPasswordSubmit: (event: SyntheticEvent) => void;
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

function SignUpView(props: {
  onPasswordSubmit: (event: SyntheticEvent) => void;
  onEmailSubmit: (event: SyntheticEvent) => void;
  onWeb3Connect: () => void;
  view: View;
}) {
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
              onSubmit={props.onEmailSubmit}
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
      <SignUpEmailForm onEmailSubmit={props.onEmailSubmit} />
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

SignUpView.propTypes = {
  onWeb3Connect: PropTypes.func.isRequired,
  onEmailSubmit: PropTypes.func.isRequired,
  onPasswordSubmit: PropTypes.func.isRequired,
  view: PropTypeView,
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
            onPasswordSubmit={props.onPasswordSubmit}
            view={props.view}
          />
        )}
      </Box>
    </>
  );
}

OnboardForm.propTypes = {
  onWeb3Connect: PropTypes.func.isRequired,
  onEmailSubmit: PropTypes.func.isRequired,
  onPasswordSubmit: PropTypes.func.isRequired,
  view: PropTypeView,
};
