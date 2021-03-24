import { useEffect, SyntheticEvent, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Onboard from "./Onboard";
import { View } from "../../PropTypes";
import { handleServerErr, isValidEmail } from "../../utils";
import { useWeb2IdentityProvider, useJwt } from "../../contexts";

export default function CreateIdentity() {
  const [view, setView] = useState<Omit<View, "SIGN_IN">>("SIGN_UP");
  const [err, setErr] = useState<string>("");
  const router = useRouter();
  const { get, set, remove } = useJwt();
  const { createWeb2IdentitySingleton } = useWeb2IdentityProvider();

  useEffect(() => {
    const verifiedEmailJWT = get("POST_EMAIL_CONFIRM");
    if (verifiedEmailJWT) setView("ENTER_PASSWORD");

    const sessionJWT = get("SESSION");
    if (sessionJWT) setView("CREATE_PROFILE");
  }, [get]);

  const onEmailSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setErr("");
    const { elements } = e.target as HTMLFormElement;
    const email = elements.namedItem("email") as HTMLInputElement;
    if (!isValidEmail(email.value)) {
      setErr("Please enter a valid email address.");
      return;
    }

    const params = new URLSearchParams();
    params.set("view", "create-app");
    if (view === "SIGN_UP") {
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

        setView("VERIFY_EMAIL");
        return;
      } catch (err) {
        handleServerErr(err, setErr);
      }
    }
  };

  const onPasswordSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setErr("");
    if (!router.query.email) {
      remove("POST_EMAIL_CONFIRM");
      setErr("Something went wrong. Please refresh the page and try again.");
      return;
    }
    const { elements } = e.target as HTMLFormElement;
    const password = elements.namedItem("password") as HTMLInputElement;
    const web2Identity = createWeb2IdentitySingleton!(
      router.query.email as string,
      password.value
    );
    try {
      const threeID = await web2Identity.signup(get("POST_EMAIL_CONFIRM")!);
      if (threeID) {
        remove("POST_EMAIL_CONFIRM");
        // throw the session token into localstorage for easy login
        set(web2Identity.token, "SESSION");
        setView("CREATE_PROFILE");
      }
    } catch (err) {
      handleServerErr(err, setErr);
    }
  };

  return (
    <Onboard
      view={view}
      error={err}
      onEmailSubmit={onEmailSubmit}
      onPasswordSubmit={onPasswordSubmit}
    />
  );
}
