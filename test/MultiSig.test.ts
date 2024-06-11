import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultiSig", function () {

  async function deployFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();
    const tokenAddress = await token.getAddress();

    const MultiSig = await ethers.getContractFactory("MultiSig");
    const multiSig = await MultiSig.deploy(
      tokenAddress
    );
    const multiSigAddress = await multiSig.getAddress();

    return {
      token,owner,otherAccount, multiSig, multiSigAddress
    }
  }

  it("Should add user", async function () {
    const {
      owner,
      token,
      multiSig,
      otherAccount,

    } = await loadFixture(deployFixture);

    expect((await multiSig.getUsers()).length).to.be.equal(1)
    const user = otherAccount.address
    const hash = await multiSig.getMessageHashAddUser(user)
    const sig = await owner.signMessage(ethers.getBytes(hash))

    await multiSig.addUser(user,[sig])
    expect((await multiSig.getUsers()).length).to.be.equal(2)
    

  })
  it("Should not add user (no signatures)", async function () {
    const {
      owner,
      token,
      multiSig,
      otherAccount,

    } = await loadFixture(deployFixture);

    const user = otherAccount.address

    await expect(multiSig.addUser(user,[])).to.be.revertedWith("You dont have the most signatures")
    

  })

  it("Should not add user (invalid sgnatures)", async function () {
    const {
      owner,
      token,
      multiSig,
      otherAccount,

    } = await loadFixture(deployFixture);

    const user = otherAccount.address
    const hash = await multiSig.getMessageHashAddUser(user)
    const sig = await otherAccount.signMessage(ethers.getBytes(hash))

    await expect(multiSig.addUser(user,[sig,sig,sig])).to.be.revertedWith("One or more signatures are not valid")
    

  })

  it("Should send amount", async function () {
    const {
      owner,
      token,
      multiSig,
      otherAccount,
      multiSigAddress

    } = await loadFixture(deployFixture);

    await token.mint(multiSigAddress,ethers.parseUnits("100","ether"))
    const user = otherAccount.address
    const hashUser = await multiSig.getMessageHashAddUser(user)
    const sigUser = await owner.signMessage(ethers.getBytes(hashUser))

    await multiSig.addUser(user,[sigUser])

    const to = otherAccount.address

    const amount = ethers.parseUnits("50","ether")

    const hash = await multiSig.getMessageHashTransfer(to, amount)
    
    const sig = await owner.signMessage(ethers.getBytes(hash))
    
    const sig2 = await otherAccount.signMessage(ethers.getBytes(hash))

    // const ethHash = await multiSig.getEthSignedMessageHash(hash)

    // console.log("signer          ", owner.address)
    // console.log("recovered signer", await multiSig.recoverSigner(ethHash, sig))

    expect(
      await multiSig.verifyTransfer(owner.address, to, amount, sig)
    ).to.equal(true)
    expect(
      await multiSig.verifyTransfer(owner.address, to, amount + BigInt(1), sig)
    ).to.equal(false)

    await multiSig.sendToken(otherAccount.address,ethers.parseUnits("50","ether"), [sig,sig2])

    expect(await token.balanceOf(otherAccount.address)).to.be.equal(ethers.parseUnits("50","ether"))
  })
  it("Should not send tokens (no signatures)", async function () {
    const {
      owner,
      token,
      multiSig,
      otherAccount,

    } = await loadFixture(deployFixture);

    const user = otherAccount.address

    await expect(multiSig.sendToken(user,1,[])).to.be.revertedWith("You dont have the most signatures")
    

  })
  it("Should not send tokens (invalid signatures)", async function () {
    const {
      owner,
      token,
      multiSig,
      otherAccount,
      multiSigAddress

    } = await loadFixture(deployFixture);
    await token.mint(multiSigAddress,ethers.parseUnits("100","ether"))

    const to = otherAccount.address

    const amount = ethers.parseUnits("50","ether")

    const hash = await multiSig.getMessageHashTransfer(to, amount)
    
    const sig = await otherAccount.signMessage(ethers.getBytes(hash))

    await expect(multiSig.sendToken(to,amount,[sig])).to.be.revertedWith("One or more signatures are not valid")
    

  })
});
