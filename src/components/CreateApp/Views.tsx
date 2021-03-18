import PropTypes from "prop-types";

export type View =
  | "CHOOSE_LOGIN_TYPE"
  | "SIGN_IN"
  | "SIGN_UP"
  | "VERIFY_EMAIL"
  | "ENTER_PASSWORD"
  | "CREATE_PROFILE";

export const PropTypeView = PropTypes.oneOf([
  "SIGN_IN",
  "SIGN_UP",
  "VERIFY_EMAIL",
  "ENTER_PASSWORD",
]).isRequired;
