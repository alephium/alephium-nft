import { SignerProvider, Project, NodeProvider } from '@alephium/web3'

export class DeployHelpers {
  signer: SignerProvider
  nodeProvider: NodeProvider

  constructor(signer: SignerProvider) {
    this.signer = signer
    this.nodeProvider = signer.nodeProvider!
  }

  async buildProject(errorOnWarnings: boolean = true): Promise<void> {
    await Project.build({ errorOnWarnings })
  }
}
