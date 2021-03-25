import { ReactNode } from "react";
export * from "./Web2Identity";
export * from "./Web3Identity";
export * from "./ManagedIdentity";

import { Web3IdentityProviderWrapper } from "./Web3Identity";
import { Web2IdentityProviderWrapper } from "./Web2Identity";
import { ManagedIdentityProviderWrapper } from "./ManagedIdentity";

export const IdentityProviderWrapper = (props: { children: ReactNode }) => {
  return (
    <Web3IdentityProviderWrapper>
      <Web2IdentityProviderWrapper>
        <ManagedIdentityProviderWrapper>
          {props.children}
        </ManagedIdentityProviderWrapper>
      </Web2IdentityProviderWrapper>
    </Web3IdentityProviderWrapper>
  );
};
