import { Agent, AgentOptions, ScrtGas, ScrtChain } from '@fadroma/client-scrt'
import { SecretNetworkClient, Wallet } from 'secretjs'
import * as constants from './constants'

export interface ScrtRPCAgentOptions extends AgentOptions {
  wallet?:  Wallet
  api?:     SecretNetworkClient
  keyPair?: unknown
}

export class ScrtRPCAgent extends Agent {

  Bundle = null

  static async create (
    chain:   Scrt,
    options: ScrtRPCAgentOptions
  ): Promise<ScrtRPCAgent> {
    const {
      mnemonic,
      keyPair,
      address
    } = options
    if (!mnemonic) {
      throw new Error(constants.ERR_ONLY_FROM_MNEMONIC)
    }
    if (keyPair) {
      console.warn(constants.WARN_IGNORING_KEY_PAIR)
      delete options.keyPair
    }
    const wallet = new Wallet(mnemonic)
    if (address && address !== wallet.address) {
      throw new Error(constants.ERR_EXPECTED_WRONG_ADDRESS)
    }
    const api = await SecretNetworkClient.create({
      chainId:       chain.id,
      grpcWebUrl:    "https://grpc-web.azure-api.net",
      wallet:        wallet,
      walletAddress: wallet.address,
    })
    return new ScrtRPCAgent(chain, { ...options, wallet, api })
  }

  constructor (chain: Scrt, options: ScrtRPCAgentOptions) {
    super(chain, options)

    this.wallet = options.wallet
    this.api    = options.api

    this.address = this.wallet.address
  }

  wallet: Wallet

  api:    SecretNetworkClient

  defaultDenomination = 'uscrt'

  address: string

  get block () {
    return this.api.query.tendermint.getLatestBlock({})
  }

  get account () {
    return this.api.query.auth.account({ address: this.address })
  }

  async send (...args: any[]) {
    throw new Error('ScrtRPCAgent#send: not implemented')
  }

  async sendMany (...args: any[]) {
    throw new Error('ScrtRPCAgent#sendMany: not implemented')
  }

  async getLabel (address: string): Promise<string> {
    const { ContractInfo: { label } } = await this.api.query.compute.contractInfo(address)
    return label
  }

  async getCodeId (address: string): Promise<string> {
    const { ContractInfo: { codeId } } = await this.api.query.compute.contractInfo(address)
    return codeId
  }

  async doQuery ({ address, codeHash }, query) {
    const contractAddress = address
    const args = { contractAddress, codeHash, query }
    return await this.api.query.compute.queryContract(args)
  }

  async doInstantiate (template, label, initMsg, initFunds = []) {
    const { codeId, codeHash } = template
    const sender = this.address
    const args = { sender, codeId, codeHash, initMsg, label, initFunds }
    return await this.api.tx.compute.instantiateContract(args)
  }

  async doExecute (instance, msg, sentFunds, memo, fee) {
    const { address, codeHash } = instance
    if (memo) {
      console.warn(constants.WARN_NO_MEMO)
    }
    const sender = this.address
    const contractAddress = address
    const args = { sender, contractAddress, codeHash, msg, sentFunds }
    return await this.api.tx.compute.executeContract(args)
  }

}

export class Scrt extends ScrtChain {
  static Mainnet = class ScrtMainnet extends ScrtChain.Mainnet {
    Agent = Scrt.Agent
  }
  static Testnet = class ScrtTestnet extends ScrtChain.Testnet {
    Agent = Scrt.Agent
  }
  static Devnet  = class ScrtDevnet  extends ScrtChain.Devnet  {
    Agent = Scrt.Agent
  }
  static Mocknet = class ScrtTestnet extends ScrtChain.Mocknet {
    Agent = Scrt.Agent
  }
  static Agent = ScrtRPCAgent
  Agent = Scrt.Agent
}

export * from '@fadroma/client-scrt'