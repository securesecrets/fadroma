import {Agent, isAgent} from '@fadroma/agent';
import {Contract} from './contract'
import Ajv, { Ajv as TAjv } from "ajv";

/** Convert snake case to camel case */
const camelCaseString = (str: string): string => {
  return str.replace(/(\_\w)/g, function (m) {
    return m[1].toUpperCase(); }); };

/** Wrap the class in proxy in order to work dynamically. */
export function Wrapper (schema: any, instance: any) {
  return new Factory(schema, instance).create(); };

/** Wrapper factory that will create all the methods */
export class Factory {

  caller:   string
  methods:  Array<any>
  ajv:      any
  schema:   any
  contract: any

  constructor(schema: Record<any, any>, contract: Contract) {
    if (typeof schema !== "object" || schema === null) {
      throw new Error("Schema must be an object"); }
    this.contract = contract;
    this.schema = JSON.parse(JSON.stringify(
      { ...schema, type: "object", $schema: undefined, }));
    this.methods = [];
    this.ajv = getAjv();
    if (this.schema.title.toLowerCase().startsWith("query")) {
      this.caller = "query"; }
    else if (this.schema.title.toLowerCase().startsWith("handle")) {
      this.caller = "execute"; } }

  /** Make a call on an agent and allow it to be overriden with custom */
  getContract(agent: Agent): Contract {
    if (isAgent(agent) && typeof this.contract.copy === "function") {
      return this.contract.copy(agent); }
    return this.contract; }

  /** Create the object with generated methods */
  create(): Record<any, any> {
    this.parse();
    return this.methods.reduce(collectMethod, {})
    function collectMethod (handlers: Record<any, any>, action: any) {
      const handler = function (
        args: Record<any, any>, agent: Agent, memo: string, transferAmount: Array<any>, fee: any
      ) {
        return this.run(action.method, args, agent, memo, transferAmount, fee); }
      handlers[camelCaseString(action.method)] = handlers[action.method] = handler.bind(this)
      return handlers; } }

  /** Parse the schema and generate method definitions */
  parse() {
    if (Array.isArray(this.schema.anyOf)) {
      for (const item of this.schema.anyOf) {
        if (item.type === "string") {
          this.onlyMethod(item); }
        else if (item.type === "object") {
          this.methodWithArgs(item); } } }
    if (this.schema.type === "string" && Array.isArray(this.schema.enum)) {
      this.onlyMethod(this.schema); } }

  /** Parse schema items that only have a method call without arguments */
  onlyMethod (item: Record<any, any>) {
    if (Array.isArray(item.enum)) {
      for (const m of item.enum) {
        this.methods.push({
          method: m,
          description: item.description,
          string: true,
          emptyArgs: true, }); } } }

  /** Parse schema item that has arguments */
  methodWithArgs(item: Record<any, any>) {
    if (Array.isArray(item.required)) {
      const m = item.required[0];

      // This is to handle those enum variants that have arguments but it's only an empty object
      if (
        Object.keys(item.properties[m]).length === 1 &&
        item.properties[m].type === "object"
      ) {
        this.methods.push({
          method: m,
          description: item.description,
          string: false,
          emptyArgs: true, }); }
      else {
        this.methods.push({
          method: m,
          description: item.description,
          string: false,
          emptyArgs: false, }); } } }

  /** Run schema validation on passed arguments */
  validate(action: Record<any, any>, args: Record<any, any>) {
    const validate = this.ajv.compile(this.schema);
    const message = { [action.method]: args || {} };
    if (!validate(message)) {
      const msg =  {
        title:            this.schema.title,
        label:            this.contract.label,
        calledAction:     { ...action, message },
        validationErrors: validate.errors, }
      throw new Error(`Arguments validation returned error:\n${JSON.stringify(msg, null, 2)}`) } }

  /** Try to find method in the parsed stack and run it */
  run(
    method: string, args: any, agent: Agent,
    memo: string, transferAmount: Array<any>, fee: any
  ) {
    for (const action of this.methods) {
      if (action.method === method) {
        if (isAgent(args) && !isAgent(agent)) {
          agent = args;
          args = {}; }
        if (action.string) {
          return this.callString(action, agent, memo, transferAmount, fee); }
        else {
          return this.callObject(action, args, agent, memo, transferAmount, fee); } } }
    // This is unreachable
    throw new Error(`Method '${method}' couldn't be found in schema definition`); }

  /** Make a call to a simple function on a contract */
  private callString(
    action: Record<any, any>, agent: Agent,
    memo: string, transferAmount: Array<any>, fee: any
  ) {
    const contract = this.getContract(agent);
    return contract[this.caller](action.method, null, undefined, memo, transferAmount, fee); }

  /** Make a call to a method that receives arguments */
  private callObject(
    action: Record<any, any>, args: Record<any, any>, agent: Agent,
    memo: string, transferAmount: Array<any>, fee: any
  ) {
    if (action.emptyArgs) {
      args = {}; }
    else {
      this.validate(action, args); }
    const contract = this.getContract(agent);
    return contract[this.caller](action.method, args, undefined, memo, transferAmount, fee); } }

/** Creates Ajv instance for schema validation*/
export function getAjv (): TAjv {
  const ajv = new Ajv({ strict: false } as any);
  addNumberType("int8",  127, -128);
  addNumberType("int16", 32767, -32768);
  addNumberType("int32", 2147483647, -2147483648);
  addNumberType("int64", BigInt("9223372036854775807"), BigInt("-9223372036854775808"));
  return ajv;

  // Add type validation for intN and add automatically uintN
  function addNumberType (name: string, max: number|bigint, min: number|bigint) {
    ajv.addFormat(name, {
      type:     "number",
      validate: (x: any) => (!isNaN(x) && x >= min && x <= max) });
    ajv.addFormat(`u${name}`, {
      type:     "number",
      validate: (x: any) => (!isNaN(x) && x >= 0 && x <= max)}); }; };
