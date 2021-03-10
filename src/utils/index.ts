import { ScopeDirection, ScopesV2 } from "@daemon-land/types";

export function makeRandomString(length: number): string {
  var result = "";
  var characters = "abcdefghijklmnopqrstuvwxyz";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function isValidEmail(string: string) {
  if (
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
      string
    )
  ) {
    return true;
  }
  return false;
}

export function pluckPermissionScope(permission: number): ScopesV2 {
  const suspectedGranted = permission & ScopeDirection.Granted;
  if (suspectedGranted === ScopeDirection.Granted) {
    return permission ^ ScopeDirection.Granted;
  } else {
    return permission ^ ScopeDirection.Received;
  }
}
