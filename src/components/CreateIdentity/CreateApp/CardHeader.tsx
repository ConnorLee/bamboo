import { Box, Text, Glyph, Title } from "@glif/react-components";
import PropTypes from "prop-types";

export default function CardHeader() {
  return (
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
          <Glyph acronym="Dl" color="white" mr={3} />
          <Box display="flex" flexDirection="column" alignItems="flex-start">
            <Text m={0}>Identity formation</Text>
            <Title m={0}>Create your daemon.land application</Title>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
