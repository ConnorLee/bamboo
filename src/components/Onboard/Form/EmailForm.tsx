import { SyntheticEvent } from "react";
import {
  Box,
  InputLabelBase,
  Input,
  Button,
  Card,
} from "@glif/react-components";
import { func } from "prop-types";

export function SignInEmailForm(props: {
  onEmailSubmit: (event: SyntheticEvent) => void;
}) {
  return (
    <form style={{ width: "100%" }} onSubmit={props.onEmailSubmit}>
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
        mb={3}
      >
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          flexWrap="wrap"
          height="100%"
        >
          <Box
            position="relative"
            display="flex"
            flexGrow="1"
            flexWrap="wrap"
            alignItems="center"
            height="100%"
          >
            <InputLabelBase display="none" htmlFor="email" />
            <Input.Base
              id="email"
              width="100%"
              pr={8}
              overflow="scroll"
              placeholder="you@you.com"
              pl={3}
              height="100%"
              flexShrink="1"
            />
          </Box>
        </Box>
      </Card>
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
              placeholder="password"
              pl={3}
              height="100%"
              flexShrink="1"
              type="password"
            />
            <Button
              position="absolute"
              right="0"
              mx={2}
              px={4}
              type="submit"
              title="Sign in"
            />
          </Box>
        </Box>
      </Card>
    </form>
  );
}

SignInEmailForm.propTypes = {
  onEmailSubmit: func.isRequired,
};

export function SignUpEmailForm(props: {
  onEmailSubmit: (event: SyntheticEvent) => void;
}) {
  return (
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
            <InputLabelBase display="none" htmlFor="email" />
            <Input.Base
              id="email"
              width="100%"
              pr={8}
              overflow="scroll"
              placeholder="you@you.com"
              pl={3}
              height="100%"
              flexShrink="1"
            />
            <Button
              position="absolute"
              right="0"
              mx={2}
              px={4}
              type="submit"
              title="Verify email"
            />
          </Box>
        </form>
      </Box>
    </Card>
  );
}

SignUpEmailForm.propTypes = {
  onEmailSubmit: func.isRequired,
};
