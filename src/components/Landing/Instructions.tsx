export default function Instructions() {
  return (
    <div className="flex between">
      <div className="bg-white h-auto w-auto shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200 w-96">
          <li className="px-6 py-4">Deposit bUSD as collateral</li>
          <li className="px-6 py-4">Borrow bbUSD</li>
          <li className="px-6 py-4">Optional: Repay your debt</li>
        </ul>
      </div>
      <div className="w-auto ml-10">
        <h1 className="mt-3 text-3xl font-extrabold text-white">
          Self-Repaying Loans
        </h1>
        <p className="mt-5 text-lg text-gray-300">
          V1 of Bamboo protocol will be launched with a synthetic derivative,
          "bbUSD", which will be mintable by depositing bUSD. Users can mint
          bbUSD up to 50% of the deposited amount at a 2:1 ratio.
        </p>
        <p className="mt-5 text-lg text-gray-300">
          - Withdraw collateral (as much as allowed as debt is gradually paid
          off)
          <br />
          - Mint more bbUSD up to 50% of the deposited amount
          <br />
          - Liquidate a part of your collateral to pay back the remaining loan,
          and withdraw the rest.
          <br />
        </p>
      </div>
    </div>
  );
}
