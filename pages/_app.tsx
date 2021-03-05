import { AppProps } from "next/app";
import "../styles/globals.css";
import { IdentityProviderWrapper } from "../src/IdentityProvider";

function App({ Component, pageProps }: AppProps) {
  return (
    <IdentityProviderWrapper>
      <Component {...pageProps} />
    </IdentityProviderWrapper>
  );
}

export default App;
