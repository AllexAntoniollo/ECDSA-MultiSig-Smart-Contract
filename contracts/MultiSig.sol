// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract MultiSig {


    address public owner;
    mapping(address => bool) public isUser;
    address[] public userList;
    IERC20 public token;
    uint public numOfUsers;

    constructor(address _token) {
        token = IERC20(_token);
        owner = msg.sender;
        userList.push(msg.sender);
        isUser[msg.sender] = true;
        ++numOfUsers;
    }

    function addUser(address _user, bytes[] memory signatures) external {
        require(signatures.length > numOfUsers / 2,"You dont have the most signatures");
        require(!isUser[_user], "User already added");
        uint validSignatures;
        for (uint256 index = 0; index < signatures.length; index++) {
            for (uint256 indexJ = 0; indexJ < userList.length; indexJ++) {
                if(verifyAddUser(userList[indexJ], _user, signatures[index])){
                    ++validSignatures;
                    break;
                }
            }
        }
        require(validSignatures > numOfUsers/2,"One or more signatures are not valid");
        isUser[_user] = true;
        userList.push(_user);
        ++numOfUsers;
    }

    function isUserAddress(address _user) external view returns (bool) {
        return isUser[_user];
    }

    function getUsers() public view returns (address[] memory) {
        return userList;
    }
    function sendToken(address to, uint amount, bytes[] memory signatures) external {
        require(signatures.length > numOfUsers / 2,"You dont have the most signatures");
        require(token.balanceOf(address(this)) > amount,"This contract does not have suficient balance to spend");
        uint validSignatures;
        for (uint256 index = 0; index < signatures.length; index++) {
            for (uint256 indexJ = 0; indexJ < userList.length; indexJ++) {
                if(verifyTransfer(userList[indexJ], to, amount, signatures[index])){
                    ++validSignatures;
                    break;
                }
            }
        }
        require(validSignatures > numOfUsers/2,"One or more signatures are not valid");
        
        token.transfer(to,amount);

    }

    function getMessageHashTransfer(
        address _to,
        uint256 _amount
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_to, _amount));
    }
    function getMessageHashAddUser(
        address _user
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_user));
    }
    function getEthSignedMessageHash(bytes32 _messageHash)
        public
        pure
        returns (bytes32)
    {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
        return keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash)
        );
    }
    function verifyTransfer(
        address _signer,
        address _to,
        uint256 _amount,
        bytes memory signature
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHashTransfer(_to, _amount);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, signature) == _signer;
    }
    function verifyAddUser(
        address _signer,
        address _user,
        bytes memory signature
    ) public pure returns (bool) {
        bytes32 messageHash = getMessageHashAddUser(_user);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, signature) == _signer;
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig)
        public
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "invalid signature length");

        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        // implicitly return (r, s, v)
    }



}
