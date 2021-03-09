import { SyntheticEvent } from "react";
import PropTypes from "prop-types";
import { Box } from "@glif/react-components";

import SignInView from "./SignIn";
import SignUpView from "./SignUp";
import { PropTypeView, View } from "../View";

type OnboardFormProps = {
  view: View;
  onEmailSubmit: (event: SyntheticEvent) => void;
  onWeb3Connect: () => void;
  onPasswordSubmit: (event: SyntheticEvent) => void;
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
