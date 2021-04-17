import { AppProps } from "next/app";
import "../styles/normalize.css";
import "../styles/styles.css";
import { Web3ContextProvider } from "../src/contexts";

function App({ Component, pageProps }: AppProps) {
  return (
    <Web3ContextProvider>
      <Component {...pageProps} />
    </Web3ContextProvider>
  );
}

export default App;
