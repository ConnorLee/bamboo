import {
  useCallback,
  useState,
  createContext,
  useContext,
  ReactNode,
} from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import { provider } from "web3-core";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import BigNumber from "bignumber.js";

const READ_WEB3_PROVIDER = new Web3.providers.HttpProvider(
  process.env.NEXT_PUBLIC_ETH_RPC_URL!
);

type Web3ContextType = {
  network: number;
  address: string;
  connected: boolean;
  web3Provider: null | provider;
  connect: () => Promise<provider>;
};

const Web3Context = createContext<Web3ContextType>({
  network: 0,
  address: "",
  connected: false,
  web3Provider: null,
  connect: async () => READ_WEB3_PROVIDER,
});

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: "5d9781cca5414d37822533fbf1e6ef9d",
    },
  },
};

export const Web3ContextProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState(0);
  const [connected, setConnected] = useState(false);
  const [web3Provider, setWeb3Provider] = useState(null);

  const connect = useCallback(async () => {
    if (web3Provider) return web3Provider;

    const web3Modal = new Web3Modal({
      providerOptions,
      cacheProvider: true,
      theme: "dark",
    });
    const provider = await web3Modal.connect();
    const web3 = new Web3(provider);
    const [address] = await web3.eth.getAccounts();
    const chainId = await web3.eth.getChainId();
    setAddress(address);
    setNetwork(chainId);
    setConnected(true);
    setWeb3Provider(provider);

    // TODO - should be subscribed in a useEffect and unsubscribe from them on cleanup to avoid mem leaks
    // https://github.com/codemotionapps/react-native-dark-mode/issues/36#issuecomment-550079882
    provider.on("accountsChanged", ([address]: string[]) => {
      setAddress(address);
    });
    provider.on("chainChanged", (chainId: string) => {
      setNetwork(new BigNumber(chainId).toNumber());
    });
    provider.on("disconnect", () => setConnected(false));
    return provider;
  }, [connected]);

  return (
    <Web3Context.Provider
      value={{ address, network, connected, connect, web3Provider }}
    >
      {children}
    </Web3Context.Provider>
  );
};

Web3ContextProvider.propTypes = {
  children: PropTypes.node,
};

Web3ContextProvider.defaultProps = {
  children: <></>,
};

export const useWeb3Provider = () => useContext(Web3Context);
