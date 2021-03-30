import Web3 from "web3";
import { provider } from "web3-core";
import { Manage3IDs, EthereumAuthProvider } from "@daemon-land/3id-connect";
import CeramicClient from "@ceramicnetwork/http-client";
import ThreeIDResolver from "@ceramicnetwork/3id-did-resolver";
import { DID, DIDProvider } from "dids";
import axios from "axios";

export default class Web3Identity {
  _didProvider: DIDProvider;
  _address: string = "";
  _did: string = "";
  verifiedEthAddressToken: string = "";
  constructor(
    didProvider: DIDProvider,
    address: string,
    didString: string,
    opts?: Partial<{ url: string; ceramicUrl: string; sessionToken: string }>
  ) {
    if (!didProvider)
      throw new Error("Must pass did provider to Web3Identity constructor");
    this._didProvider = didProvider;
    if (!address)
      throw new Error("Must pass address to Web3Identity constructor");
    this._address = address;
    if (!didString)
      throw new Error("Must pass did to Web3Identity constructor");
    this._did = didString;
    if (opts?.sessionToken) {
      this.verifiedEthAddressToken = opts?.sessionToken;
    }
  }

  static async create(
    web3Provider: provider,
    opts: Partial<{
      url: string;
      ceramicUrl: string;
      sessionToken: string;
    }> = {
      url: process.env.NEXT_PUBLIC_DL_URL,
      ceramicUrl: process.env.NEXT_PUBLIC_CERAMIC_URL,
      sessionToken: "",
    }
  ) {
    const ceramic = new CeramicClient(opts?.ceramicUrl);
    const web3 = new Web3(web3Provider);
    try {
      const [address] = await web3.eth.getAccounts();
      const managed3ID = new Manage3IDs(
        new EthereumAuthProvider(web3Provider, address),
        {
          ceramic,
        }
      );

      const didString = await managed3ID.createAccount();
      const provider = (await managed3ID.didProvider(didString)) as DIDProvider;

      await ceramic.setDIDProvider(provider);
      const resolver = ThreeIDResolver.getResolver(ceramic);
      const did = new DID({ resolver, provider });
      await did.authenticate();
      const jws = await did.createJWS({ did: didString, ethAddress: address });
      const verified = await axios.post(
        `${
          opts?.url || process.env.NEXT_PUBLIC_DL_URL
        }/v0/verifications/eth-address`,
        {
          jws,
          did: didString,
          ethAddress: address,
        }
      );

      if (verified.status !== 201) throw new Error("Bad signature");

      const res = await axios.post(
        `${opts?.url || process.env.NEXT_PUBLIC_DL_URL}/v0/identity`,
        {
          username: address,
          did: didString,
          method: "ETH_ADDRESS",
        },
        {
          headers: {
            Authorization: `Bearer ${verified.data.jwt}`,
          },
        }
      );

      if (res.status !== 201) throw new Error("Error creating new DID");

      return new Web3Identity(provider, address, didString, {
        ...opts,
        sessionToken: verified.data.jwt,
      });
    } finally {
      await ceramic.close();
    }
  }

  get didProvider(): DIDProvider {
    return this._didProvider;
  }

  get address(): string {
    return this._address;
  }

  get did(): string {
    return this._did;
  }
}
