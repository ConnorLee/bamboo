import React, { useEffect, useState } from "react";
import { Box, Title, Header, HeaderGlyph } from "@glif/react-components";
import { useRouter } from "next/router";
import axios from "axios";
import PropTypes from "prop-types";
import { useWeb2IdentityProvider, useJwt } from "../../contexts";
import SwitchView, { View } from "./View";
import OnboardForm from "../OnboardForm";
import { isValidEmail } from "../../utils";

export default function Onboard(props: {
  setLoggedIn: (loggedIn: boolean) => void;
}) {
  const [view, setView] = useState<View>("SIGN_IN");
  const router = useRouter();
  const { get, set, remove } = useJwt();
  const { createWeb2IdentitySingleton } = useWeb2IdentityProvider();
  const [err, setErr] = useState<string>("");
  const [creating3ID, setCreating3ID] = useState<boolean>(false);

  useEffect(() => {
    const verifiedEmailJWT = get("POST_EMAIL_CONFIRM");
    if (verifiedEmailJWT) setView("ENTER_PASSWORD");
  }, [get]);

  return (
    <>
      <Box
        position="relative"
        display="flex"
        flexWrap="wrap"
        minHeight="90vh"
        alignItems="center"
        justifyContent="space-evenly"
        flexGrow="1"
        p={[2, 3, 5]}
      >
        <Box
          display="flex"
          maxWidth={13}
          width={["100%", "100%", "40%"]}
          flexDirection="column"
          alignItems="flex-start"
          alignContent="center"
          mb={4}
        >
          <HeaderGlyph
            alt="Source: https://unsplash.com/photos/g2Zf3hJyYAc"
            text="Identity"
            imageUrl="/imgverify.png"
            color="white"
            fill="white"
          />
          <Box
            display="flex"
            flexDirection="column"
            mt={[2, 4, 4]}
            alignSelf="center"
            textAlign="left"
          >
            <Header lineHeight={1}>Decentralized identity management</Header>
            <Title mt={3} lineHeight="140%">
              Bring your identity and data with you to the apps you use. Apps
              must request your permission to read your data and add to it.
            </Title>
          </Box>
        </Box>
        <Box width="100%" maxWidth={13}>
          <OnboardForm
            creating3ID={creating3ID}
            error={err}
            view={view}
            // TODO: add error feedback here
            onEmailSubmit={async (e: React.FormEvent) => {
              e.preventDefault();
              setErr("");
              const { elements } = e.target as HTMLFormElement;
              const email = elements.namedItem("email") as HTMLInputElement;
              if (!isValidEmail(email.value)) {
                setErr("Please enter a valid email address.");
                return;
              }
              if (view === "SIGN_UP") {
                const params = new URLSearchParams(
                  router.query as Record<string, string>
                );
                params.set("view", "permission");
                const res = await axios.post(
                  `${process.env
                    .NEXT_PUBLIC_DL_URL!}/v0/verifications/email/send`,
                  {
                    email: email.value,
                    params: params.toString(),
                  }
                );

                if (res.status !== 201) {
                  setErr(
                    "Whoops! There was an error sending you a verification email. Please come back tomorrow and try again."
                  );
                  return;
                }

                setView("VERIFY_EMAIL");
                return;
              }

              if (view === "SIGN_IN") {
                const password = elements.namedItem(
                  "password"
                ) as HTMLInputElement;
                // TODO: password strength detection
                if (!password) {
                  setErr("Please enter a valid password.");
                  return;
                }

                const web2Identity = createWeb2IdentitySingleton!(
                  email.value,
                  password.value
                );

                const threeID = await web2Identity.login();
                if (threeID) {
                  // throw the session token into localstorage for easy login
                  set(web2Identity.token, "SESSION");
                  props.setLoggedIn(true);
                }
              }
            }}
            onWeb3Connect={() => {
              console.log("Clicked web3 connect!");
              setErr("");
            }}
            onPasswordSubmit={async (e) => {
              e.preventDefault();
              setErr("");
              if (!router.query.email) {
                remove("POST_EMAIL_CONFIRM");
                setErr(
                  "Something went wrong. Please refresh the page and try again."
                );
                return;
              }
              const { elements } = e.target as HTMLFormElement;
              const password = elements.namedItem(
                "password"
              ) as HTMLInputElement;
              setCreating3ID(true);
              try {
                const web2Identity = createWeb2IdentitySingleton!(
                  router.query.email as string,
                  password.value
                );
                const threeID = await web2Identity.signup(
                  get("POST_EMAIL_CONFIRM")!
                );
                if (threeID) {
                  remove("POST_EMAIL_CONFIRM");
                  // throw the session token into localstorage for easy login
                  set(web2Identity.token, "SESSION");
                  setCreating3ID(false);
                  props.setLoggedIn(true);
                }
              } catch (err) {
                setErr(err.message);
                setCreating3ID(false);
              }
            }}
          />
          <SwitchView
            view={view}
            onSwitch={(view: View) => {
              setErr("");
              setView(view);
            }}
          />
        </Box>
      </Box>
    </>
  );
}

Onboard.propTypes = {
  setLoggedIn: PropTypes.func.isRequired,
};
