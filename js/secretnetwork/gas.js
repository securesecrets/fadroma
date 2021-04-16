export function formatGas (x) {
  return {amount:[{amount:String(x),denom:'uscrt'}], gas: String(x)}
}

export const defaultFees = {
  upload: formatGas(2000000),
  init:   formatGas( 500000),
  exec:   formatGas(1000000),
  send:   formatGas( 500000),
}

export default Object.assign(formatGas, {defaultFees})
