import React, { useEffect, useState } from "react";
import { Router, useRouter } from "next/router";
import { Box, Button, Text } from "@glif/react-components";
import { AccessController, Resource } from "@daemon-land/sdk";
import {
  useJwt,
  useManagedIdentityProvider,
  useUserState,
  useWeb2IdentityProvider,
} from "../../contexts";
import PermissionForm from "./PermissionForm";
import { generateReturnURL } from "../../utils";
import {
  AuthenticationStatus,
  PermissionPagePropType,
  PermissionPageProps,
} from "../../PropTypes";
import EnterPassword from "./EnterPassword";
import Step from "./StepHeader";
import LoggedOutLanding from "./LoggedOutLanding/";

function determineTotalStepsOnLand(
  authenticationStatus: AuthenticationStatus
): number {
  if (authenticationStatus === "ACTIVE_SESSION_SIGN_UP") return 2;
  if (authenticationStatus === "ACTIVE_SESSION_LANDING") return 2;
  if (authenticationStatus === "POST_EMAIL_CONFIRM") return 3;
  return 0;
}

export default function PermissionRequest(props: PermissionPageProps) {
  const userState = useUserState();
  const { createWeb2IdentitySingleton } = useWeb2IdentityProvider();
  const router = useRouter();
  const { get, remove, set } = useJwt();
  const [err, setErr] = useState<string>("");
  const [step, setStep] = useState<number>(1);
  const [totalSteps, setTotalSteps] = useState<number>(
    determineTotalStepsOnLand(userState.authenticationStatus)
  );
  const [landingState, setLandingState] = useState<AuthenticationStatus>("");
  const [determinedLandingState, setDeterminedLandingState] = useState<boolean>(
    false
  );

  useEffect(() => {
    if (userState.loaded && !determinedLandingState) {
      setDeterminedLandingState(true);
      setLandingState(userState.authenticationStatus);
      setTotalSteps(determineTotalStepsOnLand(userState.authenticationStatus));
    }
  }, [
    userState.loaded,
    userState.authenticationStatus,
    determinedLandingState,
  ]);

  // checks to see if the permission has already been granted
  // if it has, forward the user back to the calling app immediately
  useEffect(() => {
    const checkIfPermAlreadyGrantedAndForward = async () => {
      const permissions = new AccessController({
        sessionToken: get("PDM_SESSION")!,
        serviceUrl: `${process.env.NEXT_PUBLIC_DL_URL!}/rpc/v0`,
      });

      const did = router.query.requesterDID as string;
      const resource = router.query.resource as Resource;
      const permission = Number(router.query.permission);

      const hasPerm = await permissions.hasPermission({
        did,
        resource,
        scope: AccessController.pluckPermissionScope(permission),
      });

      if (hasPerm) {
        const returnURL = await generateReturnURL(
          did,
          permission,
          resource,
          get("PDM_SESSION")!,
          process.env.NEXT_PUBLIC_DL_URL!,
          router.query.state as string
        );
        router.push(returnURL);
        return;
      }
    };

    if (userState.loaded && get("PDM_SESSION")) {
      checkIfPermAlreadyGrantedAndForward();
    }
  }, [userState.loaded]);

  if (userState.authenticationStatus === "") {
    return <LoggedOutLanding profile={props.profile!} />;
  }

  if (userState.authenticationStatus === "ACTIVE_SESSION_SIGN_IN") {
    return (
      <PermissionForm
        profile={props.profile!}
        permissionRequest={props.permissionRequest!}
        sessionToken={get("SESSION")!}
        landingState={"ACTIVE_SESSION_SIGN_IN"}
        step={step}
        setStep={setStep}
      />
    );
  }

  return (
    <Step profile={props.profile!} step={step} totalSteps={totalSteps}>
      {(userState.authenticationStatus === "ACTIVE_SESSION_SIGN_UP" ||
        userState.authenticationStatus === "ACTIVE_SESSION_LANDING") && (
        <PermissionForm
          profile={props.profile!}
          permissionRequest={props.permissionRequest!}
          sessionToken={get("SESSION")!}
          landingState={landingState}
          step={step}
          setStep={setStep}
        />
      )}
      {userState.authenticationStatus === "POST_EMAIL_CONFIRM" && (
        <Box mt={5}>
          {step === 1 && (
            <Box
              display="flex"
              flexDirection="column"
              width="100%"
              mt={2}
              textAlign="center"
              alignItems="center"
            >
              <Text>
                To finish setting up your Glif account, you'll set a password.
              </Text>
              <Text color="core.primary">Take care of your password. 🔐</Text>
              <Text>Without it, nobody can access your account.</Text>
              <Button
                mt={7}
                width={8}
                variant="primary"
                title="Next"
                type="submit"
                onClick={() => setStep(2)}
              />
            </Box>
          )}
          {step === 2 && (
            <EnterPassword
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
                    userState.setAuthenticationStatus("ACTIVE_SESSION_SIGN_UP");
                    setStep(3);
                  }
                } catch (err) {
                  setErr(err.message);
                }
              }}
            />
          )}
        </Box>
      )}
    </Step>
  );
}

PermissionRequest.propTypes = PermissionPagePropType;
