import {
  createContext,
  useContext,
  useCallback,
  useState,
  ReactNode,
} from "react";
import { ManagedIdentity } from "../../modules/Identity";
import { useJwt } from "../JWTProvider";
import { DIDProvider } from "dids";

type ManagedIdentityContextType = {
  managedIdentitySingleton: ManagedIdentity | null;
  createManagedIdentitySingleton: (
    didProvider: DIDProvider
  ) => Promise<ManagedIdentity | null>;
};

export const ManagedIdentityContext = createContext<ManagedIdentityContextType>(
  {
    managedIdentitySingleton: null,
    createManagedIdentitySingleton: async () => null,
  }
);

interface IdentityProviderProps {
  children: ReactNode;
}

export const ManagedIdentityProviderWrapper = (
  props: IdentityProviderProps
) => {
  const [
    managedIdentitySingleton,
    setManagedIdentitySingleton,
  ] = useState<ManagedIdentity | null>(null);
  const jwt = useJwt();

  const createManagedIdentitySingleton = useCallback(
    async (threeIDProvider: DIDProvider): Promise<ManagedIdentity> => {
      const pdmSessionToken = jwt.get("PDM_SESSION");
      if (pdmSessionToken) {
        const identity = new ManagedIdentity(threeIDProvider, {
          url: process.env.NEXT_PUBLIC_DL_URL,
          ceramicUrl: process.env.NEXT_PUBLIC_CERAMIC_URL,
          sessionToken: pdmSessionToken,
        });
        setManagedIdentitySingleton(identity);
        return identity;
      } else {
        const identity = await ManagedIdentity.create(threeIDProvider, {
          url: process.env.NEXT_PUBLIC_DL_URL,
          ceramicUrl: process.env.NEXT_PUBLIC_CERAMIC_URL,
        });
        jwt.set(identity.appToken, "PDM_SESSION");
        setManagedIdentitySingleton(identity);
        return identity;
      }
    },
    [jwt]
  );

  return (
    <ManagedIdentityContext.Provider
      value={{ managedIdentitySingleton, createManagedIdentitySingleton }}
    >
      {props.children}
    </ManagedIdentityContext.Provider>
  );
};

export const useManagedIdentityProvider = (): ManagedIdentityContextType =>
  useContext(ManagedIdentityContext);
