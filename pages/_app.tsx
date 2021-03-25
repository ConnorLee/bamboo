import { AppProps } from "next/app";
import { theme, ThemeProvider } from "@glif/react-components";
import "../styles/normalize.css";
import "../styles/styles.css";
import {
  IdentityProviderWrapper,
  JwtProvider,
  UserStateProvider,
  Web3ContextProvider,
} from "../src/contexts";

function App({ Component, pageProps }: AppProps) {
  return (
    <Web3ContextProvider>
      <JwtProvider>
        <UserStateProvider>
          <ThemeProvider theme={theme}>
            <IdentityProviderWrapper>
              <Component {...pageProps} />
            </IdentityProviderWrapper>
          </ThemeProvider>
        </UserStateProvider>
      </JwtProvider>
    </Web3ContextProvider>
  );
}

export default App;
