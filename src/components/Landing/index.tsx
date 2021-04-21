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
          <div className="relative pt-12 pb-64 sm:pt-24 sm:pb-64 xl:col-start-1 xl:pb-24">
            <h1 className="mt-3 text-6xl font-extrabold text-white">
              Unlock future yield, now.
            </h1>
            <p className="mt-10 text-3xl text-white font-extrabold">
              Bamboo enables self-repaying loans that never get liquidated.
            </p>
            <p className="text-2xl text-gray-300">
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
