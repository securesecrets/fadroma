import { bold } from '@hackbg/fadroma'
import type { Uploads } from './Upload'
import type { Agent } from './Agent'

/** List of code blobs in human-readable form */
export function generateUploadsTable (uploads: Uploads) {

  const rows = []

  rows.push([bold('  code id'), bold('name\n'), bold('size'), bold('hash')])

  if (uploads.exists()) {
    for (const name of uploads.list()) {
      const {
        codeId,
        originalSize,
        compressedSize,
        originalChecksum,
        compressedChecksum,
      } = uploads.load(name)
      rows.push([
        `  ${codeId}`,
        `${bold(name)}\ncompressed:\n`,
        `${originalSize}\n${String(compressedSize).padStart(String(originalSize).length)}`,
        `${originalChecksum}\n${compressedChecksum}`
      ])
    }
  }

  return rows.sort((x,y)=>x[0]-y[0])

}

export const print = {

  url ({ protocol, hostname, port }: URL) {
    console.info(bold(`Protocol: `), protocol)
    console.info(bold(`Host:     `), `${hostname}:${port}`)
  },

  async agentBalance (agent: Agent) {
    console.info(bold(`Agent:    `), agent.address)
    try {
      const initialBalance = await agent.balance
      console.info(bold(`Balance:  `), initialBalance, `uscrt`)
    } catch (e) {
      console.warn(bold(`Could not fetch balance:`), e.message)
    }
  },

  identities (chain: any) {
    console.log('\nAvailable identities:')
    for (const identity of chain.identities.list()) {
      console.log(`  ${chain.identities.load(identity).address} (${bold(identity)})`)
    }
  },

  aligned (obj: Record<string, any>) {
    const maxKey = Math.max(...Object.keys(obj).map(x=>x.length), 15)
    for (let [key, val] of Object.entries(obj)) {
      if (typeof val === 'object') val = JSON.stringify(val)
      val = String(val)
      if ((val as string).length > 60) val = (val as string).slice(0, 60) + '...'
      console.info(bold(`  ${key}:`.padEnd(maxKey+3)), val)
    }
  },

  contracts (contracts) {
    contracts.forEach(print.contract)
  },

  contract (contract) {
    console.info(
      String(contract.codeId).padStart(12),
      contract.address,
      contract.name
    )
  },

  async token (TOKEN) {
    if (typeof TOKEN === 'string') {
      console.info(
        `   `,
        bold(TOKEN.padEnd(10))
      )
    } else {
      const {name, symbol} = await TOKEN.info
      console.info(
        `   `,
        bold(symbol.padEnd(10)),
        name.padEnd(25).slice(0, 25),
        TOKEN.address
      )
    }
  },

  receipt (name, receipt) {
    if (receipt.address) {
      console.info(
        `${receipt.address}`.padStart(45),
        String(receipt.codeId||'n/a').padStart(6),
        bold(name.padEnd(35)),
      )
    } else {
      console.warn(
        '(non-standard receipt)'.padStart(45),
        'n/a'.padEnd(6),
        bold(name.padEnd(35)),
      )
    }
  }

}
