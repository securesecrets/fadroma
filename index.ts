// Reexport the main libraries
export * from '@fadroma/cli'
export * from '@fadroma/ops'
export * from '@fadroma/scrt'
export * from '@fadroma/snip20'

// Logging interface - got one of these in each module.
// Based on @hackbg/konzola, reexported through @fadroma/ops.
import { Console, bold } from '@fadroma/ops'
const console = Console('@hackbg/fadroma')

// The namedChains are functions keyed by chain id,
// which give you the appropriate Chain and Agent
// for talking to that chain id.
import { Chain } from '@fadroma/ops'
import Mocks from  '@fadroma/mocknet'
import Scrt_1_2 from '@fadroma/scrt-1.2'
Object.assign(Chain.namedChains, {
  'Scrt_1_2_Mainnet': Scrt_1_2.chains.Mainnet,
  'Scrt_1_2_Testnet': Scrt_1_2.chains.Testnet,
  'Scrt_1_2_Devnet':  Scrt_1_2.chains.Devnet,
  'Mocknet': () => {
    console.warn(bold('HELP WANTED:'), 'The Mocknet is far from implemented.')
    return Mocks.Chains.Mocknet()
  },
})

// Default export is an interface to @fadroma/cli,
// a command runner based on @hackbg/komandi.
import { Fadroma } from '@fadroma/cli'
export default new Fadroma()

// Individual chain implementations are also exported,
// so that you can name a Scrt_1_0.Agent or
// a Scrt_1_2.Contract<Scrt_1_2.Client>>.
export { Scrt_1_2 }
