import { createContext, useContext, ReactNode, useState } from "react";
import Identity from "../../modules/Identity";

type IdentityContextType = {
  identitySingleton: Identity | null;
  createIdentitySingleton:
    | ((email: string, password: string) => Identity)
    | null;
};

export const IdentityContext = createContext<IdentityContextType>({
  identitySingleton: null,
  createIdentitySingleton: null,
});

interface IdentityProviderProps {
  children: ReactNode;
}

export const IdentityProviderWrapper = (props: IdentityProviderProps) => {
  const [identitySingleton, setIdentitySingleton] = useState<Identity | null>(
    null
  );

  const createIdentitySingleton = (
    email: string,
    password: string
  ): Identity => {
    const identity = new Identity(email, password, {
      url: process.env.NEXT_PUBLIC_DL_URL!,
      ceramicUrl: process.env.NEXT_PUBLIC_CERAMIC_URL!,
    });
    setIdentitySingleton(identity);
    return identity;
  };

  return (
    <IdentityContext.Provider
      value={{ identitySingleton, createIdentitySingleton }}
    >
      {props.children}
    </IdentityContext.Provider>
  );
};

export const useIdentityProvider = (): IdentityContextType =>
  useContext(IdentityContext);
