import {
  web3,
  SignerProvider,
  Project,
} from '@alephium/web3'

export class DeployHelpers {
  signer: SignerProvider

  constructor(
    signer: SignerProvider
  ) {
    this.signer = signer
    signer.nodeProvider && web3.setCurrentNodeProvider(signer.nodeProvider)
    signer.explorerProvider && web3.setCurrentExplorerProvider(signer.explorerProvider)
  }

  async buildProject(errorOnWarnings: boolean = true): Promise<void> {
    await Project.build({ errorOnWarnings })
  }
}
