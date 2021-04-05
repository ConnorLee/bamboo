import { Wallet } from "ethers";
import HDWallet from "@truffle/hdwallet-provider";
import axios from "axios";
import { DagJWS } from "dids";
import { _signAsPDM, getPDMSessionToken } from "../../utils";
import Web3Identity from "./Web3Identity";
import ManagedIdentity from "./ManagedIdentity";
import { ScopeDirection, ScopesV2 } from "@daemon-land/types";

const RPC_URL = "https://mainnet.infura.io/v3/059af1cbdd20486c9b254b2e951e7df5";
const CERAMIC_URL = "http://localhost:7007";
const DL_URL = "http://localhost:3001";

// we mock this call and just imitate what its like in the backend handlers
jest
  .spyOn(require("../../utils/signAsPDM"), "default")
  .mockImplementation(async (operandDID, sig) => {
    // this is the exact same method as the api handler
    const jws = await _signAsPDM(
      operandDID as string,
      sig as DagJWS,
      process.env.PDM_SEED as string,
      CERAMIC_URL
    );
    const token = await getPDMSessionToken(jws, operandDID as string);
    return token;
  });

describe("Web3Identity", () => {
  let provider: HDWallet;
  let wallet: Wallet;
  beforeEach(async () => {
    wallet = Wallet.createRandom();
    provider = new HDWallet({
      mnemonic: wallet.mnemonic.phrase,
      providerOrUrl: RPC_URL,
    });
  });

  afterEach(async () => {
    await provider.engine.stop();
  });

  test("static web3Identity.create method creates a web3Identity instance with a did provider", async () => {
    const web3Identity = await Web3Identity.create(provider, {
      ceramicUrl: CERAMIC_URL,
      url: DL_URL,
    });

    expect(web3Identity.didProvider).toBeTruthy();
  });

  test("static web3Identity.create method creates a web3Identity that gets cached in the API", async () => {
    const web3Identity = await Web3Identity.create(provider, {
      ceramicUrl: CERAMIC_URL,
      url: DL_URL,
    });

    expect(web3Identity.didProvider).toBeTruthy();
    expect(web3Identity.verifiedEthAddressToken).toBeTruthy();

    const { data } = await axios.get(`http://localhost:3001/v0/identity`, {
      headers: {
        Authorization: `Bearer ${web3Identity.verifiedEthAddressToken}`,
      },
    });

    expect(data.did).toBe(web3Identity.did);
    expect(data.username).toBe(web3Identity.address);
  });

  test("it works with ManagedIdentity to add permissions and profile fields", async () => {
    const web3Identity = await Web3Identity.create(provider, {
      ceramicUrl: CERAMIC_URL,
      url: DL_URL,
    });

    const managedIdentity = await ManagedIdentity.create(
      web3Identity.didProvider,
      {
        url: DL_URL,
        ceramicUrl: CERAMIC_URL,
      }
    );

    await managedIdentity.profile.create({ name: "jon" });
    const profile = await managedIdentity.profile.get();
    expect(profile?.name).toBe("jon");

    await managedIdentity.permissions.add({
      did: "did:3:123",
      permission: ScopeDirection.Granted | ScopesV2.Read,
      resource: "PROFILE",
    });
    const perm = await managedIdentity.permissions.get({
      did: "did:3:123",
      resource: "PROFILE",
    });
    expect(perm?.permission).toBe(ScopesV2.Read | ScopeDirection.Granted);
  }, 50000);
});
