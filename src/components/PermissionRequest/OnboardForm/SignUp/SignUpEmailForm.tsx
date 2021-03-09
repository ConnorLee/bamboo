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

export default function SignUpEmailForm(props: {
  onEmailSubmit: (event: SyntheticEvent) => void;
  error?: string;
}) {
  return (
    <>
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
      {props.error && (
        <Box pt={0} mx={0} textAlign="center" minHeight={6} mt={3}>
          <Label color="status.fail.background" m={0}>
            {props.error}
          </Label>
        </Box>
      )}
    </>
  );
}

SignUpEmailForm.propTypes = {
  onEmailSubmit: func.isRequired,
  error: string,
};

SignUpEmailForm.defaultProps = {
  error: "",
};
