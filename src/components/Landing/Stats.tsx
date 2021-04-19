export default function Stats() {
  return (
    <div className="mt-8 mb-24">
      <h3 className="text-lg leading-6 font-medium text-white">Last 30 days</h3>
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            Estimated APY
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">55%</dd>
        </div>

        <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            APY W/ LOAN REINVESTMENT
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">85%</dd>
        </div>

        <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            MAX LOAN ON DEPOSIT
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">50%</dd>
        </div>

        <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            AUTOMATIC REPAYMENT PERIOD
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            330 DAYS
          </dd>
        </div>
      </dl>
    </div>
    // <div className="mt-12 grid grid-cols-4 gap-y-12 gap-x-6 sm:grid-cols-4">
    //   <p>
    //     <span className="block text-2xl font-bold text-white">55%</span>
    //     <span className="mt-1 block text-base text-gray-300">
    //       <span className="font-medium text-white">EST APY</span>
    //     </span>
    //   </p>

    //   <p>
    //     <span className="block text-2xl font-bold text-white">85%</span>
    //     <span className="mt-1 block text-base text-gray-300">
    //       <span className="font-medium text-white">APY W/ LOAN REINVESTED</span>
    //     </span>
    //   </p>

    //   <p>
    //     <span className="block text-2xl font-bold text-white">50%</span>
    //     <span className="mt-1 block text-base text-gray-300">
    //       <span className="font-medium text-white">MAX LOAN ON DEPOSIT</span>
    //     </span>
    //   </p>

    //   <p>
    //     <span className="block text-2xl font-bold text-white">330 DAYS</span>
    //     <span className="mt-1 block text-base text-gray-300">
    //       <span className="font-medium text-white">
    //         AUTOMATIC REPAYMENT PERIOD
    //       </span>
    //     </span>
    //   </p>
    // </div>
  );
}
