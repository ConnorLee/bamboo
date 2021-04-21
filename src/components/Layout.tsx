import { ReactNode } from "react";
import { node } from "prop-types";
import Header from "./Header";

export default function Layout(props: { children: ReactNode }) {
  return (
    <>
      <div
        className="h-screen"
        style={{
          backgroundImage: "url(/green.jpg)",
          backgroundSize: "cover",
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
