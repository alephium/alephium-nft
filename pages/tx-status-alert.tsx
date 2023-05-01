import * as web3 from "@alephium/web3"
import { useTxStatus } from "@alephium/web3-react"
import { Loading } from "@web3uikit/core"
import { useState } from "react"

interface TxStatusAlertProps {
  txId: string
  description: string
  txStatusCallback(status: web3.node.TxStatus): Promise<any>
}

export function useTxStatusStates() {
  const [ongoingTxId, setOngoingTxId] = useState<string | undefined>(undefined)
  const [ongoingTxDescription, setOngoingTxDescription] = useState<string>("")
  async function defaultTxStatusCallback(status: web3.node.TxStatus) { }
  const [txStatusCallback, setTxStatusCallback] = useState(() => defaultTxStatusCallback)

  function resetTxStatus() {
    setOngoingTxId(undefined)
    setOngoingTxDescription("")
    setTxStatusCallback(() => defaultTxStatusCallback)
  }

  return [
    ongoingTxId,
    setOngoingTxId,
    ongoingTxDescription,
    setOngoingTxDescription,
    txStatusCallback,
    setTxStatusCallback,
    resetTxStatus
  ] as const
}

const TxStatusAlert = ({ txId, description, txStatusCallback }: TxStatusAlertProps) => {
  let numberOfChecks = 0
  const { txStatus } = useTxStatus(txId, (status) => {
    numberOfChecks = numberOfChecks + 1

    if ((status.type === 'Confirmed' && numberOfChecks === 2) || (status.type === 'TxNotFound' && numberOfChecks === 3)) {
      txStatusCallback(status)
    }

    return Promise.resolve()
  })

  return (<h1 className="px-20 py-10 text-3xl"><Loading spinnerType='wave' spinnerColor='grey' text={`Transaction for ${description}: ${txStatus?.type}`} size={30} /></h1>)
}

export default TxStatusAlert