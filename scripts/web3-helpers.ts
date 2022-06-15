import * as web3 from '@alephium/web3'

export class Web3Helpers {
  provider: web3.NodeProvider
  signer: web3.SignerProvider
  signerAddress: string
  deployFromSource: boolean

  constructor(
    provider: web3.NodeProvider,
    signer: web3.NodeWallet,
    signerAddress: string,
    deployFromSource: boolean = false
  ) {
    this.provider = provider
    this.signer = signer
    this.signerAddress = signerAddress
    this.deployFromSource = deployFromSource
  }

  async callTxScript(
    script: web3.Script,
    params: web3.BuildExecuteScriptTx
  ): Promise<web3.SignExecuteScriptTxResult> {
    const deployParams = await script.paramsForDeployment(params)
    const scriptSubmitResult = await this.signer.signExecuteScriptTx(deployParams)
    return scriptSubmitResult
  }

  async createContract(
    contract: web3.Contract,
    params: web3.BuildExecuteScriptTx
  ): Promise<web3.SignDeployContractTxResult> {
    const execParams = await contract.paramsForDeployment(params)
    const submitResult = await this.signer.signDeployContractTx(execParams)
    return submitResult
  }
}