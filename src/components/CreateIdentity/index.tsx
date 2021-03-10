import { useEffect, SyntheticEvent, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Onboard from "./Onboard";
import { View } from "../PermissionRequest/View";
import { isValidEmail } from "../../utils";
import { useIdentityProvider, useJwt } from "../../contexts";

export default function CreateIdentity() {
  const [view, setView] = useState<Omit<View, "SIGN_IN">>("SIGN_UP");
  const [err, setErr] = useState<string>("");
  const router = useRouter();
  const { get, set, remove } = useJwt();
  const { createIdentitySingleton } = useIdentityProvider();

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

    if (view === "SIGN_UP") {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_DL_URL!}/v0/verifications/email/send`,
        {
          email: email.value,
          state: "create-app",
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
    const identitySingleton = createIdentitySingleton!(
      router.query.email as string,
      password.value
    );
    const threeID = await identitySingleton.signup(get("POST_EMAIL_CONFIRM")!);
    if (threeID) {
      remove("POST_EMAIL_CONFIRM");
      // throw the session token into localstorage for easy login
      set(identitySingleton.token, "SESSION");
      setView("CREATE_PROFILE");
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
