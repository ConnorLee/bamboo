import { createContext, useContext, ReactNode, useState } from "react";
import { Web2Identity } from "../../modules/Identity";

type Web2IdentityContextType = {
  web2IdentitySingleton: Web2Identity | null;
  createWeb2IdentitySingleton:
    | ((email: string, password: string) => Web2Identity)
    | null;
};

export const Web2IdentityContext = createContext<Web2IdentityContextType>({
  web2IdentitySingleton: null,
  createWeb2IdentitySingleton: null,
});

interface IdentityProviderProps {
  children: ReactNode;
}

export const Web2IdentityProviderWrapper = (props: IdentityProviderProps) => {
  const [
    web2IdentitySingleton,
    setWeb2IdentitySingleton,
  ] = useState<Web2Identity | null>(null);

  const createWeb2IdentitySingleton = (
    email: string,
    password: string
  ): Web2Identity => {
    const identity = new Web2Identity(email, password, {
      url: process.env.NEXT_PUBLIC_DL_URL!,
      ceramicUrl: process.env.NEXT_PUBLIC_CERAMIC_URL!,
    });
    setWeb2IdentitySingleton(identity);
    return identity;
  };

  return (
    <Web2IdentityContext.Provider
      value={{ web2IdentitySingleton, createWeb2IdentitySingleton }}
    >
      {props.children}
    </Web2IdentityContext.Provider>
  );
};

export const useWeb2IdentityProvider = (): Web2IdentityContextType =>
  useContext(Web2IdentityContext);
