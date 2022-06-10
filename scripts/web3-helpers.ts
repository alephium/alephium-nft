import * as web3 from 'alephium-web3'

export class Web3Helpers {
  provider: web3.NodeProvider
  signer: web3.NodeWallet

  constructor(
    provider: web3.NodeProvider,
    signer: web3.NodeWallet
  ) {
    this.provider = provider
    this.signer = signer
  }

  async callTxScript(
    scriptFileName: string,
    params: Omit<web3.BuildExecuteScriptTx, 'signerAddress'>,
    signerAddress?: string
  ): Promise<web3.SubmissionResult> {
    const script = await web3.Script.fromSource(this.provider, scriptFileName)
    const scriptTx = await script.transactionForDeployment(this.signer, params)

    const scriptSubmitResult = await this.signer.submitTransaction(
      scriptTx.unsignedTx, scriptTx.txId, signerAddress
    )

    return scriptSubmitResult
  }

  async createContract(
    contractName: string,
    params: Omit<web3.BuildExecuteScriptTx, 'signerAddress'>,
    signerAddress?: string
  ): Promise<web3.DeployContractTransaction> {
    const contract = await web3.Contract.fromSource(this.provider, contractName)
    const tx = await contract.transactionForDeployment(this.signer, params)
    const submitResult = await this.signer.submitTransaction(
      tx.unsignedTx, tx.txId, signerAddress
    )

    return tx
  }
}