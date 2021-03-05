import React, { useState, SyntheticEvent } from "react";
import { useIdentityProvider } from "../../IdentityProvider";
import OnboardForm from "./Form";

export default function Signup() {
  const {} = useIdentityProvider();

  const onEmailSubmit = async (
    e: SyntheticEvent,
    email: string
  ): Promise<void> => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
          alt="Workflow"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a decentralized identity
        </h2>
        <OnboardForm />
      </div>
    </div>
  );
}
