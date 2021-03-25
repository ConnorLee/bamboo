import { createContext, useContext, useState, ReactNode } from "react";
import { provider } from "web3-core";
import { Web3Identity } from "../../modules/Identity";

type Web3IdentityContextType = {
  web3IdentitySingleton: Web3Identity | null;
  createWeb3IdentitySingleton: (
    web3Provider: provider
  ) => Promise<Web3Identity | null>;
};

export const Web3IdentityContext = createContext<Web3IdentityContextType>({
  web3IdentitySingleton: null,
  createWeb3IdentitySingleton: async () => null,
});

interface IdentityProviderProps {
  children: ReactNode;
}

export const Web3IdentityProviderWrapper = (props: IdentityProviderProps) => {
  const [web3IdentitySingleton, setWeb3IdentitySingleton] = useState<any>(null);

  const createWeb3IdentitySingleton = async (
    web3Provider: provider
  ): Promise<Web3Identity> => {
    const identity = await Web3Identity.create(web3Provider, {
      url: process.env.NEXT_PUBLIC_DL_URL!,
      ceramicUrl: process.env.NEXT_PUBLIC_CERAMIC_URL!,
    });
    setWeb3IdentitySingleton(identity);
    return identity;
  };

  return (
    <Web3IdentityContext.Provider
      value={{ web3IdentitySingleton, createWeb3IdentitySingleton }}
    >
      {props.children}
    </Web3IdentityContext.Provider>
  );
};

export const useWeb3IdentityProvider = (): Web3IdentityContextType =>
  useContext(Web3IdentityContext);
