import PropTypes from "prop-types";

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
