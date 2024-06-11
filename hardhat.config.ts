import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version:"0.8.24",
    settings:{
      evmVersion: "paris",
    }
  },
  
  networks: {
    bscTestnet: {
      url: process.env.RPC_URL,
      chainId: parseInt(`${process.env.CHAIN_ID}`),
      accounts: [process.env.SECRET!], 
    },
  },
};

export default config;
