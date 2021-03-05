import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

export const IdentityContext = createContext({});

interface IdentityProviderProps {
  children: ReactNode;
}

export const IdentityProviderWrapper = (props: IdentityProviderProps) => {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState({});
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
    }
  }, [mounted, setMounted, setState]);

  return (
    <IdentityContext.Provider value={{}}>
      {props.children}
    </IdentityContext.Provider>
  );
};

export const useIdentityProvider = (): {} => useContext(IdentityContext);
