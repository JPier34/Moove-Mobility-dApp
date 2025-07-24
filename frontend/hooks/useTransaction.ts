import { useState } from "react";
import { handleWeb3Error } from "@/utils/web3ErrorHandler";

interface TransactionState {
  hash?: string;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const useTransaction = () => {
  const [txState, setTxState] = useState<TransactionState>({
    loading: false,
    error: null,
    success: false,
  });

  const [txReceipt, setTxReceipt] = useState<any>(null);

  const executeTransaction = async (
    transactionFunction: () => Promise<{
      hash: string;
      wait: () => Promise<any>;
    }>
  ) => {
    setTxState({ loading: true, error: null, success: false });
    setTxReceipt(null);

    try {
      const tx = await transactionFunction();
      setTxState((prev) => ({ ...prev, hash: tx.hash }));

      const receipt = await tx.wait(); // waiting for the transaction to be mined
      setTxReceipt(receipt);

      setTxState((prev) => ({
        ...prev,
        loading: false,
        success: true,
      }));
    } catch (error: any) {
      setTxState({
        loading: false,
        error: handleWeb3Error(error),
        success: false,
      });
    }
  };

  const reset = () => {
    setTxState({ loading: false, error: null, success: false });
    setTxReceipt(null);
  };

  return {
    ...txState,
    txReceipt,
    executeTransaction,
    reset,
  };
};
