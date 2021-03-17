import { ReactNode } from "react";
export * from "./Web2Identity";
export * from "./ManagedIdentity";

import { Web2IdentityProviderWrapper } from "./Web2Identity";
import { ManagedIdentityProviderWrapper } from "./ManagedIdentity";

export const IdentityProviderWrapper = (props: { children: ReactNode }) => {
  return (
    <Web2IdentityProviderWrapper>
      <ManagedIdentityProviderWrapper>
        {props.children}
      </ManagedIdentityProviderWrapper>
    </Web2IdentityProviderWrapper>
  );
};
