import { ReactNode } from "react";
import { node } from "prop-types";
import Header from "./Header";

export default function Layout(props: { children: ReactNode }) {
  return (
    <>
      <div
        style={{
          backgroundImage: "url(/green.jpg)",
          backgroundRepeat: "repeat",
        }}
      >
        <Header />
        {props.children}
      </div>
    </>
  );
}

Layout.propTypes = {
  children: node.isRequired,
};
