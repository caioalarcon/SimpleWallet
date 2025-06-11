import { createTransaction } from '@kadena/client';
import { IUnsignedCommand } from '@kadena/types';

export function formatForSigning(cmd: any): IUnsignedCommand {
  const pactCommand = {
    networkId: cmd.networkId,
    payload: { exec: { code: cmd.pactCode, data: cmd.envData || {} } },
    meta: cmd.meta,
    signers: Array.isArray(cmd.signers) ? cmd.signers : [],
    nonce: cmd.nonce || new Date().toISOString(),
  };
  return createTransaction(pactCommand);
}
