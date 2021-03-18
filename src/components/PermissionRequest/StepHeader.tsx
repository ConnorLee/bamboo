import React, { ReactNode } from "react";
import { Box, Card, StepHeader } from "@glif/react-components";
import PropTypes from "prop-types";
import { SpiritProfile } from "@daemon-land/types";
import { MinimalProfilePropType } from "../../PropTypes";

export default function Step(props: {
  profile: SpiritProfile;
  totalSteps: number;
  step: number;
  children: ReactNode;
}) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100%"
      alignItems="center"
      mb={6}
    >
      <Card
        p={0}
        maxWidth={13}
        width="100%"
        minWidth={11}
        display="flex"
        flex="1"
        flexDirection="column"
        justifyContent="space-between"
        border="none"
        mt={5}
      >
        <StepHeader
          title={`Sign into ${props.profile.name}`}
          // TODO `step` here is unecessary, it just silences the propType errors from StepHeader - fix should be in react-component lib
          step={props.step}
          currentStep={props.step}
          totalSteps={props.totalSteps}
          glyphAcronym="Si"
        >
          {/* TODO: Silence these proptype errors! WTF */}
          <></>
        </StepHeader>
        {props.children}
      </Card>
    </Box>
  );
}

StepHeader.propTypes = {
  profile: MinimalProfilePropType,
  children: PropTypes.node.isRequired,
  step: PropTypes.number.isRequired,
  totalSteps: PropTypes.number.isRequired,
};
