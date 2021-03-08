import PropTypes from "prop-types";

export type View = "SIGN_IN" | "SIGN_UP" | "VERIFY_EMAIL" | "ENTER_PASSWORD";

export const PropTypeView = PropTypes.oneOf([
  "SIGN_IN",
  "SIGN_UP",
  "VERIFY_EMAIL",
  "ENTER_PASSWORD",
]).isRequired;
