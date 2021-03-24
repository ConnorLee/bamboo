import React, { SyntheticEvent, useState } from "react";
import axios from "axios";
import { Box, Card, Text } from "@glif/react-components";
import { useRouter } from "next/router";
import styled from "styled-components";
import {
  useJwt,
  useUserState,
  useWeb2IdentityProvider,
} from "../../../contexts";
import Select from "./Select";
import SignInView from "../../OnboardForm/SignIn";
import { handleServerErr, isValidEmail } from "../../../utils";
import SignUpEmailForm from "../../OnboardForm/SignUp/SignUpEmailForm";

const HoverableLink = styled(Text)`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export default function Form(props: {
  setView: (view: "SIGN_IN" | "SIGN_UP" | "") => void;
  view: "SIGN_IN" | "SIGN_UP" | "";
}) {
  const { setAuthenticationStatus } = useUserState();
  const router = useRouter();
  const { createWeb2IdentitySingleton } = useWeb2IdentityProvider();
  const { remove, set } = useJwt();
  const { cacheKeyCarrier } = useUserState();
  const [emailInFlight, setEmailInFlight] = useState<boolean>(false);
  const [err, setErr] = useState<string>("");

  const onSignUp = async (e: SyntheticEvent) => {
    e.preventDefault();
    setErr("");
    const { elements } = e.target as HTMLFormElement;
    const email = elements.namedItem("email") as HTMLInputElement;
    if (!isValidEmail(email.value)) {
      setErr("Please enter a valid email.");
      return;
    }

    const params = new URLSearchParams(router.query as Record<string, string>);
    // this is used on the return to know we are creating a user and not an app
    // when creating an app, `view` ==> `create-app`
    params.set("view", "permission");
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_DL_URL!}/v0/verifications/email/send`,
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
      setEmailInFlight(true);
    } catch (err) {
      handleServerErr(err, setErr);
    }
  };

  const onSignIn = async (e: SyntheticEvent) => {
    e.preventDefault();
    const { elements } = e.target as HTMLFormElement;
    const email = elements.namedItem("email") as HTMLInputElement;
    if (!isValidEmail(email.value)) {
      setErr("Please enter a valid email.");
      return;
    }
    const password = elements.namedItem("password") as HTMLInputElement;
    if (!password.value) {
      setErr("Please enter your password");
      return;
    }

    const web2Identity = createWeb2IdentitySingleton!(
      email.value,
      password.value
    );
    try {
      await web2Identity.login();
      remove("POST_EMAIL_CONFIRM");
      // throw the session token into localstorage for easy login
      set(web2Identity.token, "SESSION");
      setAuthenticationStatus("ACTIVE_SESSION_SIGN_IN");
    } catch (err) {
      handleServerErr(err, setErr);
    }
  };

  return (
    <Box width="100%" maxWidth={13}>
      {!props.view && (
        <>
          <Box display="flex" alignItems="center" justifyContent="center">
            <Text>Sign up with your email</Text>
          </Box>
          <Select
            onClick={() => {
              cacheKeyCarrier("CUSTODIED");
              props.setView("SIGN_UP");
            }}
            title="Get started"
            glyphAcronym="Gs"
          />
          <Box display="flex" alignItems="center" justifyContent="center">
            <Text>Have an account already?</Text>
          </Box>
          <Select
            onClick={() => {
              cacheKeyCarrier("CUSTODIED");
              props.setView("SIGN_IN");
            }}
            title="Sign in"
            glyphAcronym="Si"
          />
        </>
      )}
      <Box display="flex" flexDirection="column" justifyContent="center">
        {!!props.view && (
          <Card
            display="flex"
            flexDirection="column"
            pt={6}
            pb={5}
            px={3}
            border="none"
            mt={[5, 0, 0]}
            alignItems="center"
            justifyContent="center"
            borderRadius={2}
            width={13}
            bg="background.screen"
            boxShadow={2}
          >
            {props.view === "SIGN_IN" && (
              <SignInView onSubmit={onSignIn} error={err} />
            )}
            {props.view === "SIGN_UP" && (
              <>
                {emailInFlight ? (
                  <>
                    <Text>Please check your email.</Text>
                  </>
                ) : (
                  <>
                    <Box
                      display="flex"
                      width="100%"
                      justifyContent="space-between"
                      flexWrap="wrap"
                      mb={3}
                    >
                      <Text
                        color="core.nearblack"
                        textAlign="center"
                        p="0"
                        m={0}
                        mr={1}
                      >
                        SIGN UP
                      </Text>
                    </Box>
                    <SignUpEmailForm onEmailSubmit={onSignUp} error={err} />
                  </>
                )}
              </>
            )}
            {!emailInFlight && (
              <Box
                display="flex"
                flexDirection="row"
                width="100%"
                justifySelf="flex-start"
                mt={3}
              >
                {props.view === "SIGN_IN" ? (
                  <Box display="flex">
                    <Text color="core.darkgray" p="0" m={0} my={3} mr={2}>
                      Don't have an account yet?
                    </Text>
                    <HoverableLink
                      color="core.primary"
                      p="0"
                      m={0}
                      my={3}
                      onClick={() => {
                        setErr("");
                        props.setView("SIGN_UP");
                      }}
                    >
                      Create one
                    </HoverableLink>
                  </Box>
                ) : (
                  <Box display="flex">
                    <Text color="core.darkgray" p="0" m={0} my={3} mr={2}>
                      Already have an account?
                    </Text>
                    <HoverableLink
                      color="core.primary"
                      p="0"
                      m={0}
                      my={3}
                      onClick={() => {
                        setErr("");
                        props.setView("SIGN_IN");
                      }}
                    >
                      Sign in
                    </HoverableLink>
                  </Box>
                )}
              </Box>
            )}
          </Card>
        )}
        <Box mt={6} display="flex" alignItems="center" justifyContent="center">
          <Text>Or connect your Ethereum wallet</Text>
        </Box>
        <Select
          onClick={() => {
            cacheKeyCarrier("SELF_CUSTODIED");
          }}
          title="Connect wallet"
          glyphAcronym="Cw"
        />
      </Box>
    </Box>
  );
}
