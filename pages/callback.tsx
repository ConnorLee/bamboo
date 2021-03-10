import { useEffect } from "react";
import axios from "axios";
import { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useJwt } from "../src/contexts";

const getJWT = async (code: string, email: string) => {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_DL_URL!}/v0/verifications/email/verify`,
      {
        code,
        email,
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
  email: string;
  state: "create-app" | "permission" | "";
}

export default function Callback(props: InitialCallbackProps) {
  const jwt = useJwt();
  const router = useRouter();
  useEffect(() => {
    if (props.jwt) {
      jwt.set(props.jwt, "POST_EMAIL_CONFIRM");
      const params = new URLSearchParams(
        router.query as Record<string, string>
      );
      params.delete("code");
      router.replace(`/${props.state}?${params.toString()}`);
    }
  }, [props.jwt, router.query]);
  return null;
}

Callback.getInitialProps = async ({
  query,
}: NextPageContext): Promise<InitialCallbackProps> => {
  try {
    if (!query.code || !query.email || !query.state) {
      return {
        jwt: "",
        error: new Error("Bad params passed in the URL bar"),
        email: "",
        state: "",
      };
    }
    const jwt = await getJWT(query.code as string, query.email as string);
    return {
      jwt,
      email: query.email as string,
      state: query.state as "create-app" | "permission",
      error: null,
    };
  } catch (error) {
    return { jwt: "", email: "", state: "", error: error.message };
  }
};
