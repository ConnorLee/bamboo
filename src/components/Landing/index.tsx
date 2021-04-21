import React from "react";
{
  /* import Header from "../Header"; */
}
import Instructions from "./Instructions";
import Stats from "./Stats";

export default function Landing() {
  return (
    <>
      <div className="relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="relative">
            <h1 className="mt-3 text-5xl text-white">
              Unlock future yield, now.
            </h1>
            <p className="mt-10 text-3xl text-white">
              Bamboo enables self-repaying loans that never get liquidated.
            </p> <br />
            <p className="text-2xl text-gray-300 font-light">
              Coming soon to Binance Smart Chain.
            </p>
            {/* <Stats />
            <Instructions /> */}
          </div>
        </div>
      </div>
    </>
  );
}
