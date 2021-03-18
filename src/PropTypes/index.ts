import PropTypes from "prop-types";
import { PermissionRequestV2, SpiritProfile } from "@daemon-land/types";

export const ResourcePropType = PropTypes.oneOf([
  "DATASTORE",
  "PROFILE",
  "ROOT",
]).isRequired;

export const PermissionRequestV2PropType = PropTypes.shape({
  requesterDID: PropTypes.string.isRequired,
  resource: ResourcePropType,
  permission: PropTypes.number.isRequired,
  state: PropTypes.string,
  //TODO add datastore specific fields here when ready
});

export type MinimalProfile = {
  name: string;
  callbackUrl: string;
  imageUrl: string;
};

export type PermissionPageProps = {
  permissionRequest: PermissionRequestV2 | null;
  profile: SpiritProfile | null;
  invalidParamsErr: boolean;
};

export const MinimalProfilePropType = PropTypes.shape({
  name: PropTypes.string.isRequired,
  callbackUrl: PropTypes.string.isRequired,
  imageUrl: PropTypes.string.isRequired,
});

export const PermissionPagePropType = {
  permissionRequest: PermissionRequestV2PropType.isRequired,
  profile: MinimalProfilePropType.isRequired,
  invalidParamsErr: PropTypes.bool,
};

export type AuthenticationStatus =
  | "ACTIVE_SESSION_SIGN_UP"
  | "ACTIVE_SESSION_SIGN_IN"
  | "ACTIVE_SESSION_LANDING"
  | "POST_EMAIL_CONFIRM"
  | "";
