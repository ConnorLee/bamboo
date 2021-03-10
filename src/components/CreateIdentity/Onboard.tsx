import { SyntheticEvent } from "react";
import {
  Box,
  Button,
  Card,
  IconGlif,
  Menu,
  Title,
  Text,
  InputLabelBase,
  Input,
} from "@glif/react-components";
import { View } from "../PermissionRequest/View";
import SignUpEmailForm from "../OnboardForm/SignUp/SignUpEmailForm";

function EnterEmail(props: {
  onSubmit: (event: SyntheticEvent) => void;
  error?: string;
}) {
  return (
    <>
      <SignUpEmailForm onEmailSubmit={props.onSubmit} error={props.error} />
      <Text color="core.darkgray" textAlign="center" p="0" m={0} mt={5}>
        *Please note - for a short period of time, you must use a different
        email than the one you used for a personal identity. Later, you can link
        these identities together.
      </Text>
    </>
  );
}

function EnterPassword(props: {
  onSubmit: (event: SyntheticEvent) => void;
  error?: string;
}) {
  return (
    <>
      <Text color="core.nearblack" textAlign="center" p="0" m={0} mr={1} mb={1}>
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
            onSubmit={props.onSubmit}
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

export default function Onboard(props: {
  onPasswordSubmit: (event: SyntheticEvent) => void;
  onEmailSubmit: (event: SyntheticEvent) => void;
  view: Omit<View, "SIGN_IN">;
  error?: string;
}) {
  return (
    <Box
      display="block"
      margin="0 auto"
      py={[2, 4]}
      pl={[3, 4, 6, 7]}
      pr={[3, 4, 6]}
      maxWidth={16}
      width="100%"
      minHeight="100vh"
    >
      <Menu
        position="relative"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        flexWrap="wrap"
        maxWidth={18}
        margin="0 auto"
      >
        <Box py={4} my={4} px={2} borderRadius={4} border={1} bg="black">
          <IconGlif size={[7, 8]} p={2} position="relative" fill="white" />
        </Box>
        <Title textAlign="center" fontSize={[5, 6]}>
          Register a new application.
        </Title>
      </Menu>

      <Box
        display="flex"
        flexDirection="column"
        p={3}
        mt={5}
        minHeight={10}
        alignItems="center"
        justifyContent="center"
        borderRadius={2}
        bg="background.screen"
      >
        {props.view === "SIGN_UP" && (
          <EnterEmail onSubmit={props.onEmailSubmit} error={props.error} />
        )}
        {props.view === "VERIFY_EMAIL" && <Title>Check your email!</Title>}
        {props.view === "ENTER_PASSWORD" && (
          <EnterPassword
            onSubmit={props.onPasswordSubmit}
            error={props.error}
          />
        )}
        {props.view === "CREATE_PROFILE" && <div>Create profile</div>}
      </Box>
    </Box>
  );
}
