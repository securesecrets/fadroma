/** Extend SecretNetworkContract class
 * with methods automatically generated
 * from provided JSON schema. */
export default function extendWithSchema (SecretNetworkContract, schema) {

  return class SecretNetworkContractWithSchema extends SecretNetworkContract {
    // read-only: the parsed schema
    static get schema () { return schema }
    // read-only: the queries generated from the schema
    get q () {
      return methodsFromSchema(this, this.constructor.schema.queryMsg, (self, method) => ({
        async [method] (args, agent = self.agent) { return await self.query(method, args, agent) }
      }))
    }
    // read-only: the transactions generated from the schema
    get tx () {
      return methodsFromSchema(this, this.constructor.schema.handleMsg, (self, method) => ({
        async [method] (args, agent = self.agent) { return await self.execute(method, args, agent) }
      }))
    }
  }

  // TODO: memoize this, so that methods aren't regenerated until the schema updates
  // TODO: generate TypeScript types from autogenerated method lists and/or from schema
  function methodsFromSchema (self, schema, getWrappedMethod) {
    if (!schema) return null
    return schema.anyOf.reduce((methods, methodSchema)=>{
      const {description, required:[methodName]} = methodSchema
      const methodWrapper = getWrappedMethod(self, methodName)
      methodWrapper[methodName].description = description
      methodWrapper[methodName] = methodWrapper[methodName].bind(self)
      return Object.assign(methods, methodWrapper)
    }, {})
  }

}