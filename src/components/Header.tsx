import { SyntheticEvent, useState } from "react";
import Link from "next/link";
import { useWeb3Provider } from "../contexts";
import { useRouter } from "next/dist/client/router";
import classNames from "classnames";

export default function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { connect, connected } = useWeb3Provider();
  const { pathname } = useRouter();
  return (
    <>
      <div className="relative flex-grow-0">
        <div className="flex justify-between items-center px-4 py-6 sm:px-6 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link href="/">
              <a>
                <span className="sr-only">Workflow</span>
                <img className="h-8 w-auto sm:h-10" src="/bamboo.png" alt="" />
              </a>
            </Link>
          </div>
          {/* <div className="-mr-2 -my-2 md:hidden">
            <button
              type="button"
              className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded="false"
              onClick={(e: SyntheticEvent) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMobileMenu(true);
              }}
            >
              <span className="sr-only">Open menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div> */}
          <nav className="hidden md:flex space-x-10 items-center">
            {/* <Link href="/">
              <a
                className={classNames(
                  "text-base font-medium hover:text-white",
                  pathname === "/" ? "text-white" : "text-gray-500"
                )}
              >
                HOME
              </a>
            </Link>
            <Link href="/borrow">
              <a
                className={classNames(
                  "text-base font-medium hover:text-white",
                  pathname.includes("borrow") ? "text-white" : "text-gray-500"
                )}
              >
                BORROW
              </a>
            </Link>
            <Link href="/convert">
              <a
                className={classNames(
                  "text-base font-medium hover:text-white",
                  pathname.includes("convert") ? "text-white" : "text-gray-500"
                )}
              >
                CONVERT
              </a>
            </Link>
            <Link href="/farm">
              <a
                className={classNames(
                  "text-base font-medium hover:text-white",
                  pathname.includes("farm") ? "text-white" : "text-gray-500"
                )}
              >
                FARM
              </a>
            </Link>
            <Link href="/buy">
              <a
                className={classNames(
                  "text-base font-medium hover:text-white",
                  pathname.includes("buy") ? "text-white" : "text-gray-500"
                )}
              >
                BUY
              </a>
            </Link> */}
            <div className="relative">
              {/* <!-- Item active: "text-gray-900", Item inactive: "text-gray-500" --> */}
              <button
                disabled
                type="button"
                className="inline-flex items-center px-4 py-2 text-xs font-medium rounded shadow-sm text-white bg-green-600 border-none"
                aria-expanded="false"
                onClick={async () => {
                  return;
                  // if (!connected) await connect();
                }}
              >
                {connected ? <span>Connected</span> : <span class="comingsoon">COMING SOON</span>}
              </button>
            </div>
          </nav>
        </div>
        {/* <!--
          Mobile menu, show/hide based on mobile menu state.

          Entering: "duration-200 ease-out"
            From: "opacity-0 scale-95"
            To: "opacity-100 scale-100"
          Leaving: "duration-100 ease-in"
            From: "opacity-100 scale-100"
            To: "opacity-0 scale-95"
        --> */}
        {showMobileMenu && (
          <></>
          // <div className="absolute z-10 top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden">
          //   <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white">
          //     <div className="pt-5 pb-6 px-5">
          //       <div className="flex items-center justify-between">
          //         <div>
          //           <img
          //             className="h-8 w-auto"
          //             src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
          //             alt="Workflow"
          //           />
          //         </div>
          //         <div className="-mr-2">
          //           <button
          //             onClick={(e: SyntheticEvent) => {
          //               e.preventDefault();
          //               e.stopPropagation();
          //               setShowMobileMenu(false);
          //             }}
          //             type="button"
          //             className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          //           >
          //             <span className="sr-only">Close menu</span>
          //             {/* <!-- Heroicon name: outline/x --> */}
          //             <svg
          //               className="h-6 w-6"
          //               xmlns="http://www.w3.org/2000/svg"
          //               fill="none"
          //               viewBox="0 0 24 24"
          //               stroke="currentColor"
          //               aria-hidden="true"
          //             >
          //               <path
          //                 stroke-linecap="round"
          //                 stroke-linejoin="round"
          //                 stroke-width="2"
          //                 d="M6 18L18 6M6 6l12 12"
          //               />
          //             </svg>
          //           </button>
          //         </div>
          //       </div>
          //       <div className="mt-6"></div>
          //     </div>
          //     <div className="py-6 px-5">
          //       <div className="grid grid-cols-2 gap-4">
          //         <Link href="/">
          //           <a className="text-base font-medium text-gray-500 hover:text-gray-900">
          //             HOME
          //           </a>
          //         </Link>
          //         <Link href="/borrow">
          //           <a className="text-base font-medium text-gray-500 hover:text-gray-900">
          //             BORROW
          //           </a>
          //         </Link>
          //         <Link href="/convert">
          //           <a className="text-base font-medium text-gray-500 hover:text-gray-900">
          //             CONVERT
          //           </a>
          //         </Link>
          //         <Link href="/farm">
          //           <a className="text-base font-medium text-gray-500 hover:text-gray-900">
          //             FARM
          //           </a>
          //         </Link>
          //         <Link href="/buy">
          //           <a className="text-base font-medium text-gray-500 hover:text-gray-900">
          //             BUY
          //           </a>
          //         </Link>
          //       </div>
          //     </div>
          //   </div>
          // </div>
        )}
      </div>
    </>
  );
}
