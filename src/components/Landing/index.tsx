import React from "react";
import Header from "../Header";
import Instructions from "./Instructions";
import Stats from "./Stats";

export default function Landing() {
  return (
    <>
      <div className="relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="relative pt-12 pb-64 sm:pt-24 sm:pb-64 xl:col-start-1 xl:pb-24">
            <p className="mt-3 text-3xl font-extrabold text-white">
              Self repaying loans that never get liquidated.{" "}
            </p>
            <p className="mt-5 text-lg text-gray-300">
              Bamboo Vaults make it easy to take out loans on your stablecoins,
              without the risk of liquidation.
            </p>
            <Stats />
            <Instructions />
          </div>
        </div>
      </div>
    </>
  );
}
