import {
  Card,
  Box,
  InputLabelBase,
  Input,
  Label,
} from "@glif/react-components";

export default function EnterPassword(props: { error?: string }) {
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
              type="password"
              pr={8}
              overflow="scroll"
              placeholder="Password"
              pl={3}
              height="100%"
              flexShrink="1"
            />
          </Box>
        </Box>
      </Card>
      {props?.error && (
        <Box pt={0} mx={0} textAlign="center" minHeight={6} mt={3}>
          <Label color="status.fail.background" m={0}>
            {props.error}
          </Label>
        </Box>
      )}
    </>
  );
}
