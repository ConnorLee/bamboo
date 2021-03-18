import { SyntheticEvent } from "react";
import {
  Box,
  InputLabelBase,
  Input,
  Button,
  Card,
  Label,
} from "@glif/react-components";
import { func, string } from "prop-types";

export default function SignInEmailForm(props: {
  onSubmit: (event: SyntheticEvent) => void;
  error?: string;
}) {
  return (
    <form style={{ width: "100%" }} onSubmit={props.onSubmit}>
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
      {props.error && (
        <Box pt={0} mx={0} textAlign="center" minHeight={6} mt={3}>
          <Label color="status.fail.background" m={0}>
            {props.error}
          </Label>
        </Box>
      )}
    </form>
  );
}

SignInEmailForm.propTypes = {
  onSubmit: func.isRequired,
  error: string,
};

SignInEmailForm.defaultProps = {
  error: "",
};
