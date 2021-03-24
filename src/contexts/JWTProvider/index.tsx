import React, { createContext, useContext, ReactNode } from "react";
import { node } from "prop-types";

type JWT_PATH = "POST_EMAIL_CONFIRM" | "SESSION" | "PDM_SESSION";

const JwtContext = createContext({
  get: (path: JWT_PATH): string | null => null,
  set: (code: string, path: JWT_PATH) => {},
  remove: (path: JWT_PATH) => {},
});
const LS_KEY = "TOKEN";

export const JwtProvider = ({ children }: { children: ReactNode }) => {
  const set = (jwt: string, path: JWT_PATH) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${LS_KEY}/${path}`, jwt);
    }
  };

  const remove = (path: JWT_PATH) => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(`${LS_KEY}/${path}`);
    }
  };

  const get = (path: JWT_PATH): string | null => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(`${LS_KEY}/${path}`);
    }
    return null;
  };

  return (
    <JwtContext.Provider value={{ get, remove, set }}>
      {children}
    </JwtContext.Provider>
  );
};

JwtProvider.propTypes = {
  children: node,
};

JwtProvider.defaultProps = {
  children: <></>,
};

export const useJwt = () => {
  return useContext(JwtContext);
};
