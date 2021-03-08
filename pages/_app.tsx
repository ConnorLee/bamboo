import { AppProps } from "next/app";
import { theme, ThemeProvider } from "@glif/react-components";
import "../styles/normalize.css";
import "../styles/styles.css";
import "../styles/globals.css";
import { IdentityProviderWrapper } from "../src/IdentityProvider";

function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <IdentityProviderWrapper>
        <Component {...pageProps} />
      </IdentityProviderWrapper>
    </ThemeProvider>
  );
}

export default App;
