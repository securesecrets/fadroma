export * from './Model'

export * from './Agent'
export * from './Chain'
export * from './ChainNode'
export * from './Contract'
export * from './Schema'

import type { IChain, IAgent } from './Model'
import { bold } from '@hackbg/tools'
export async function init (
  CHAINS:    Record<string, Function>,
  chainName: string,
): Promise<{
  chain: IChain,
  admin: IAgent
}> {

  let chain: IChain
  let admin: IAgent

  if (!chainName || !Object.keys(CHAINS).includes(chainName)) {
    console.log(`\nSelect target chain:`)
    for (const chain of Object.keys(CHAINS)) console.log(`  ${bold(chain)}`)
    process.exit(0)
  }

  chain = await CHAINS[chainName]().ready

  try {
    admin = await chain.getAgent()
    console.info(`Operating on ${bold(chainName)} as ${bold(admin.address)}`)
    const initialBalance = await admin.balance
    console.info(`Balance: ${bold(initialBalance)}uscrt`)
    process.on('beforeExit', async () => {
      const finalBalance = await admin.balance
      console.log(`\nInitial balance: ${bold(initialBalance)}uscrt`)
      console.log(`\nFinal balance: ${bold(finalBalance)}uscrt`)
      console.log(`\nConsumed gas: ${bold(String(initialBalance - finalBalance))}uscrt`)
    })
  } catch (e) {
    console.warn(`Could not get an agent for ${chainName}: ${e.message}`)
  }

  return { chain, admin }

}

import type { ContractUpload } from './Contract'
export async function buildAndUpload (contracts: Array<ContractUpload>) {
  await Promise.all(contracts.map(contract=>contract.build()))
  for (const contract of contracts) {
    await contract.upload()
  }
}

import { resolve } from 'path'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import TOML from 'toml'
import { schemaToTypes } from './Schema'
import { cargo } from '@hackbg/tools'
export async function generateSchema (projectRoot: string, dirs: Array<string>) {

  for (const dir of dirs) {

    console.info(`Generating schema for ${bold(dir)}`)

    // Generate JSON schema
    const cargoToml = resolve(projectRoot, 'contracts', dir, 'Cargo.toml')
    const {package:{name}} = TOML.parse(readFileSync(cargoToml, 'utf8'))
    cargo('run', '-p', name, '--example', 'schema')

    // Collect generated schema definitions
    const schemaDir = resolve(projectRoot, 'contracts', dir, 'schema')
    const schemas = readdirSync(schemaDir)
      .filter(x=>x.endsWith('.json'))
      .map(x=>resolve(schemaDir, x))

    // Remove `For_HumanAddr` suffix from generic structs
    // This does a naive find'n' replace, not sure what it'll do for
    // types that are genericized over HumanAddr AND something else?
    for (const schema of schemas) {
      const content = readFileSync(schema, 'utf8')
      writeFileSync(schema, content.replace(/_for_HumanAddr/g, ''), 'utf8')
    }

    // Generate type definitions from JSON schema
    await schemaToTypes(...schemas)

  }

}
