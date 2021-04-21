import { ReactNode } from "react";
import { node } from "prop-types";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout(props: { children: ReactNode }) {
  return (
    <>
      <div
        className="h-full h-screen flex flex-col"
        style={{
          backgroundImage: "url(/green.jpg)",
          backgroundSize: "cover",
        }}
      >
        <Header />
        <div className="flex-grow">{props.children}</div>
        <Footer />
      </div>
    </>
  );
}

Layout.propTypes = {
  children: node.isRequired,
};
