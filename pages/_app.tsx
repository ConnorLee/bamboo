import { AppProps } from "next/app";
import "../styles/normalize.css";
import "../styles/styles.css";
import "tailwindcss/tailwind.css";
import { Web3ContextProvider } from "../src/contexts";
import Layout from "../src/components/Layout";

function App({ Component, pageProps }: AppProps) {
  return (
    <Web3ContextProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </Web3ContextProvider>
  );
}

export default App;
