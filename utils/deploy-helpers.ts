import {
  web3,
  Contract,
  SignerProvider,
  Script,
  BuildExecuteScriptTx,
  SignExecuteScriptTxResult,
  SignDeployContractTxResult,
  Project,
} from '@alephium/web3'

export class DeployHelpers {
  signer: SignerProvider
  signerAddress: string

  constructor(
    nodeUrl: string,
    signer: SignerProvider,
    signerAddress: string
  ) {
    this.signer = signer
    this.signerAddress = signerAddress

    web3.setCurrentNodeProvider(nodeUrl)
  }

  async buildProject(errorOnWarnings: boolean = true): Promise<void> {
    await Project.build({ errorOnWarnings })
  }

  async callTxScript(
    script: Script,
    params: BuildExecuteScriptTx
  ): Promise<SignExecuteScriptTxResult> {
    const deployParams = await script.paramsForDeployment(params)
    const scriptSubmitResult = await this.signer.signExecuteScriptTx(deployParams)
    return scriptSubmitResult
  }

  async createContract(
    contract: Contract,
    params: BuildExecuteScriptTx
  ): Promise<SignDeployContractTxResult> {
    const execParams = await contract.paramsForDeployment(params)
    const submitResult = await this.signer.signDeployContractTx(execParams)
    return submitResult
  }
}