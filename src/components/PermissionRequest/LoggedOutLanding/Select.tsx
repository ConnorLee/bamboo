import React from "react";
import { Box, Text, Glyph, Card } from "@glif/react-components";
import PropTypes from "prop-types";

export default function Select(props: {
  onClick: () => void;
  glyphAcronym: string;
  title: string;
}) {
  return (
    <Box display="flex" alignItems="center" mb={7} justifyContent="center">
      <Card
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        alignContent="space-between"
        backgroundColor="background.screen"
        height={7}
        p={2}
        css={`
          cursor: pointer;
          transition: 0.13s ease-in-out;
          &:hover {
            transform: scale(1.05);
          }
        `}
        role="button"
        onClick={props.onClick}
      >
        <Box
          display="flex"
          alignItems="center"
          textAlign="center"
          textDecoration="none"
        >
          <Glyph acronym={props.glyphAcronym} border={0} />
          <Text ml={4} my={0}>
            {props.title}
          </Text>
        </Box>
      </Card>
    </Box>
  );
}

Select.propTypes = {
  onClick: PropTypes.func.isRequired,
  glyphAcronym: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};
