import * as web3 from 'alephium-web3'

export class Web3Helpers {
  provider: web3.NodeProvider
  signer: web3.NodeWallet
  isTest: boolean

  constructor(
    provider: web3.NodeProvider,
    signer: web3.NodeWallet,
    isTest: boolean = false
  ) {
    this.provider = provider
    this.signer = signer
    this.isTest = isTest
  }

  async callTxScript(
    script: web3.Script,
    params: Omit<web3.BuildExecuteScriptTx, 'signerAddress'>,
    signerAddress?: string
  ): Promise<web3.SubmissionResult> {
    const scriptTx = await script.transactionForDeployment(this.signer, params)
    const scriptSubmitResult = await this.signer.submitTransaction(
      scriptTx.unsignedTx, scriptTx.txId, signerAddress
    )

    return scriptSubmitResult
  }

  async createContract(
    contract: web3.Contract,
    params: Omit<web3.BuildExecuteScriptTx, 'signerAddress'>,
    signerAddress?: string
  ): Promise<web3.DeployContractTransaction> {
    const tx = await contract.transactionForDeployment(this.signer, params)
    const submitResult = await this.signer.submitTransaction(
      tx.unsignedTx, tx.txId, signerAddress
    )

    return tx
  }
}