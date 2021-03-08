import PropTypes from "prop-types";

export type View = "SIGN_IN" | "SIGN_UP";

export const PropTypeView = PropTypes.oneOf(["SIGN_IN", "SIGN_UP"]).isRequired;
