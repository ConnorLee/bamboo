import { useEffect } from "react";
import axios from "axios";
import { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useJwt } from "../src/contexts";

const getJWT = async (code: string) => {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_DL_URL!}/v0/verifications/email/verify`,
      {
        code,
      }
    );

    if (res.status !== 201) {
      throw new Error("Failed to verify email address.");
    }
    return res.data.jwt;
  } catch (err) {
    // forward server error to the client
    throw new Error(err.response.data);
  }
};

interface InitialCallbackProps {
  jwt: string;
  error: Error | null;
}

export default function Callback(props: InitialCallbackProps) {
  const jwt = useJwt();
  const router = useRouter();
  useEffect(() => {
    if (props.jwt) {
      jwt.set(props.jwt, "POST_EMAIL_CONFIRM");
    }
  }, [props.jwt]);
  return <div>Verifying...</div>;
}

Callback.getInitialProps = async ({
  query,
}: NextPageContext): Promise<InitialCallbackProps> => {
  try {
    if (!query.code) {
      return { jwt: "", error: new Error("No code passed in the URL bar") };
    }
    const jwt = await getJWT(query.code as string);
    return { jwt, error: null };
  } catch (error) {
    return { jwt: "", error: error.message };
  }
};
