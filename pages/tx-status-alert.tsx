import * as web3 from "@alephium/web3"
import { useContext, useEffect, useState } from "react"
import { AlephiumWeb3Context } from "./alephium-web3-providers"

interface TxStatusAlertProps {
    txId: string
    description: string
    txStatusCallback(status: web3.node.TxStatus): Promise<any>
}

export const TxStatusAlert = ({ txId, description, txStatusCallback }: TxStatusAlertProps) => {
    const context = useContext(AlephiumWeb3Context)
    const [stopTimer, setStopTimer] = useState(false)
    const [txStatus, setTxStatus] = useState<web3.node.TxStatus | undefined>(undefined)

    async function getTransactionStatus(txId: string) {
        const txStatus = await context.nodeProvider?.transactions.getTransactionsStatus({ txId })
        setTxStatus(txStatus)

        if (txStatus.type === 'Confirmed' || txStatus.type === 'TxNotFound') {
            setStopTimer(true)
            await new Promise(r => setTimeout(r, 3000));
        }

        await txStatusCallback(txStatus)
    }

    useEffect(() => {
        setStopTimer(false)
    }, [txId])

    useEffect(() => {
        const timer = setInterval(() => {
            if (stopTimer) {
                clearTimeout(timer)
            } else {
                getTransactionStatus(txId)
            }
        }, 2000)

        return () => {
            clearTimeout(timer)
        }
    }, [stopTimer])

    if (txStatus?.type === 'Confirmed') {
        return (
            <div className="alert alert-success shadow-lg">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Transaction for {description} is confirmed!</span>
                </div>
            </div>
        )
    } else if (txStatus?.type === 'MemPooled') {
        return (
            <div className="alert alert-warning shadow-lg">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>Transaction for {description} is getting confirmed, please be patient!</span>
                </div>
            </div>
        )
    } else if (txStatus?.type === 'TxNotFound') {
        return (
            <div className="alert alert-error shadow-lg">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Transaction for {description} is not found!</span>
                </div>
            </div>
        )
    }

}