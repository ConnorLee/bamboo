import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  SetStateAction,
} from "react";
import { node } from "prop-types";
import { AuthenticationStatus } from "../../PropTypes";
import { useJwt } from "../JWTProvider";

type KeyCarrier = "SELF_CUSTODIED" | "CUSTODIED" | "";

type UserStateContextType = {
  keyCarrier: KeyCarrier;
  cacheKeyCarrier: (keyCarrier: KeyCarrier) => void;
  authenticationStatus: AuthenticationStatus;
  setAuthenticationStatus: (
    status: SetStateAction<AuthenticationStatus>
  ) => void;
  loaded: boolean;
};

const UserStateContext = createContext<UserStateContextType>({
  keyCarrier: "",
  cacheKeyCarrier: () => {},
  authenticationStatus: "",
  setAuthenticationStatus: () => {},
  loaded: false,
});

export const UserStateProvider = ({ children }: { children: ReactNode }) => {
  const { get } = useJwt();
  const [keyCarrier, setKeyCarrier] = useState<KeyCarrier>("");
  const [loaded, setLoaded] = useState<boolean>(false);

  const cacheKeyCarrier = (keyCarrier: KeyCarrier) => {
    if (!keyCarrier) return;
    setKeyCarrier(keyCarrier);
    if (!!window && typeof window !== "undefined") {
      window.localStorage.setItem("KEY_CARRIER", keyCarrier);
    }
  };

  useEffect(() => {
    if (!!window && typeof window !== "undefined") {
      const cachedKeyCarrier = window.localStorage.getItem("KEY_CARRIER");
      if (cachedKeyCarrier) setKeyCarrier(cachedKeyCarrier as KeyCarrier);
    }

    const activeSession = get("SESSION");
    if (activeSession) {
      setAuthenticationStatus("ACTIVE_SESSION_LANDING");
    } else if (get("POST_EMAIL_CONFIRM")) {
      setAuthenticationStatus("POST_EMAIL_CONFIRM");
    }

    setLoaded(true);
  }, [setKeyCarrier, get]);

  const [
    authenticationStatus,
    setAuthenticationStatus,
  ] = useState<AuthenticationStatus>("");

  return (
    <UserStateContext.Provider
      value={{
        cacheKeyCarrier,
        keyCarrier,
        authenticationStatus,
        setAuthenticationStatus,
        loaded,
      }}
    >
      {children}
    </UserStateContext.Provider>
  );
};

UserStateProvider.propTypes = {
  children: node,
};

UserStateProvider.defaultProps = {
  children: <></>,
};

export const useUserState = () => {
  return useContext(UserStateContext);
};
