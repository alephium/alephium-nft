import {
  web3,
  Contract,
  SignerProvider,
  Script,
  BuildExecuteScriptTx,
  SignExecuteScriptTxResult,
  SignDeployContractTxResult,
  Project,
  NodeProvider,
} from '@alephium/web3'

export class DeployHelpers {
  signer: SignerProvider
  signerAddress: string

  constructor(
    nodeProvider: NodeProvider,
    signer: SignerProvider,
    signerAddress: string
  ) {
    this.signer = signer
    this.signerAddress = signerAddress

    web3.setCurrentNodeProvider(nodeProvider)
  }

  async buildProject(errorOnWarnings: boolean = true): Promise<void> {
    await Project.build({ errorOnWarnings })
  }

  async callTxScript(
    script: Script,
    params: BuildExecuteScriptTx
  ): Promise<SignExecuteScriptTxResult> {
    const deployParams = await script.paramsForDeployment(params)
    const signResult = await this.signer.signExecuteScriptTx(deployParams)
    await this.signer.submitTransaction(signResult.unsignedTx, signResult.signature)
    return signResult
  }

  async createContract(
    contract: Contract,
    params: BuildExecuteScriptTx
  ): Promise<SignDeployContractTxResult> {
    const execParams = await contract.paramsForDeployment(params)
    const signResult = await this.signer.signDeployContractTx(execParams)
    await this.signer.submitTransaction(signResult.unsignedTx, signResult.signature)
    return signResult
  }
}