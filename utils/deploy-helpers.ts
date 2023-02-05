import {
  web3,
  SignerProvider,
  Project,
  NodeProvider,
} from '@alephium/web3'

export class DeployHelpers {
  signer: SignerProvider

  constructor(
    nodeProvider: NodeProvider,
    signer: SignerProvider
  ) {
    this.signer = signer

    web3.setCurrentNodeProvider(nodeProvider)
  }

  async buildProject(errorOnWarnings: boolean = true): Promise<void> {
    await Project.build({ errorOnWarnings })
  }
}
