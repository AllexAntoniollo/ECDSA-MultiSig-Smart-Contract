import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
 
const MultiSigModule = buildModule("MultiSigModule", (m) => {
 
  const contract = m.contract("MultiSig",["0xe759148646aBF1369fa973A030135b219daC1DBe"]);
 
  return { contract };
});
 
export default MultiSigModule;