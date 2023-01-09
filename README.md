>Currently WIP

### Partially Rekt



Partially REKT is a tool for Ethereum that allows you to retrieve funds from compromised accounts.

When seed phrases are compromised attackers will sweep your ETH accounts for all of the ether within them. This will make it impossible to withdraw tokens or NFT's that are in your account. Partially REKT allows you to use a seperate "safe" account to fund your compromised account via Flash Bots.

When using Partially REKT you will provide your compromised account's private key, your safe account's private key (this account should be funded with ~$20 of ETH), and the contract of the token that you are wanting to move. (Currentl you are only able to recover ERC20 tokens)

### TODO
- Add recovery for ERC721 tokens
- Add recovery for ERC1155 tokens
- Improve mobile UI

### Future Improvements
- Look into using [GNS](https://opengsn.org/) for sending the transaction to recover tokens from the compromised account. This would remove the need for exposing the private key of the "safe" account and would make the flow better overall.
