import { decodeFeedName } from './decode.js';
const FLARE_CONTRACTS = "@flarenetwork/flare-periphery-contract-artifacts";
const FLARE_RPC = "https://coston-api.flare.network/ext/C/rpc";
const FEED_PROVIDER_URL = "https://attestation-coston.aflabs.net";
const DATA_PROVIDER_URL = "http://34.38.22.100:3100/data";
const DATA_PROVIDER_APIKEY = "12345"
const FLARE_CONTRACT_REGISTRY_ADDR = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";
const jsonFile = "./artifacts/contracts/Relay.sol/Relay.json";
const fs = await import ('fs')
const parsed= JSON.parse(fs.readFileSync(jsonFile));
const abi = parsed.abi;

// You should get your private keys from an external source.
// DO NOT embed them in source code in a production environment!
const PRIVATE_KEY = "0x6607fc65548ffe231ce954018b3ee01fedb242281227e42a30a9bffa759557d7";

async function retrieveFeed() {
  
  // Set up
  const ethers = await import("ethers");
  const flare = await import(FLARE_CONTRACTS);
  const provider = new ethers.JsonRpcProvider(FLARE_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  //  Access Contract Registry
  const flareContractRegistry = new ethers.Contract(
    FLARE_CONTRACT_REGISTRY_ADDR,
    flare.nameToAbi("FlareContractRegistry", "coston").data,
    provider
  );

  // Retrieve the Relay Contract Address
  const relayAddress =
    await flareContractRegistry.getContractAddressByName("Relay");
  const relayContract = new ethers.Contract(
    relayAddress,abi,signer
  );
  const date = new Date();
  const unixTimeStamp = Math.floor(date.getTime() / 1000)-90000;
  const [,firstVotingRoundStartTs,votingEpochDurationSeconds] = await relayContract.stateData();
  const roundId = (BigInt(unixTimeStamp)-firstVotingRoundStartTs)/votingEpochDurationSeconds;
  const relayMerkleRoot = await relayContract.getConfirmedMerkleRoot(100,roundId);
  const providerMerkleRoot = await fetchMerkleRoot(roundId);
  if(relayMerkleRoot == providerMerkleRoot.merkleRoot) {
    const subMerkleTree = providerMerkleRoot.tree.slice(1,providerMerkleRoot.tree.length);
    const feeds = subMerkleTree.map((feed)=> {
          const decodedName = decodeFeedName(feed.id);
          const value = feed.value /(10 ** feed.decimals)
          const feedArr = [decodedName , value]
          return feedArr;
    })
    console.log("Feeds:",feeds);
  }
  else{
    console.log("Merkle Root not confirmed")
  }
}
async function fetchMerkleRoot(votingRoundId) {
  const fetchData = await fetch(`${DATA_PROVIDER_URL}/${votingRoundId}`,{
    method: "GET",
    headers: {
      "X-API-KEY": DATA_PROVIDER_APIKEY
  }
  })
  const response = await fetchData.json();
  return response;

}
retrieveFeed();
