import assert from 'assert'
import Docker from 'dockerode'

import { pull } from '../net.js'
import { mkdir, resolve, relative, dirname, basename
       , fileURLToPath, cwd, existsSync, readFile, writeFile } from '../sys.js'

import colors from 'colors/safe.js'
const {bold} = colors

const __dirname = dirname(fileURLToPath(import.meta.url))

const {debug, info} = console

/** Builds contracts and optionally uploads them as an agent on the Secret Network.
 * Stores upload results as receipts.
 */
export default class SecretNetworkBuilder {

  constructor (fields = {}) {
    Object.assign(this, fields)
  }

  /** Get the address of the agent attached to this builder, if it exists.
   */
  get address () {
    return this.agent ? this.agent.address : undefined
  }

  /** Build from source in a Docker container.
   */
  async build (options = {}) {
    const { buildAs, origin, ref = 'HEAD', crate, outputDir, workspace } = options
    const docker = new Docker()

    const buildOptions = {
      Env: this.getBuildEnv(),
      Tty: true,
      AttachStdin: true,
      Entrypoint: ['/bin/sh', '-c'],
      HostConfig: {
        Binds: [
          `${resolve(__dirname, 'build.sh')}:/entrypoint.sh:ro`,
          `${outputDir}:/output:rw`,
          `sienna_cache_${ref}:/code/target:rw`,
          `cargo_cache_${ref}:/usr/local/cargo:rw`,
        ]
      }
    }

    if (ref === 'HEAD') { // when building working tree
      debug(`building working tree at ${workspace} into ${outputDir}...`)
      buildOptions.HostConfig.Binds.push(`${workspace}:/contract:rw`)
    }

    const [{Error:err, StatusCode:code}, container] = await docker.run(
      await pull('enigmampc/secret-contract-optimizer:latest', docker),
      this.getBuildCommand({buildAs,origin,ref,crate}),
      process.stdout,
      buildOptions)

    await container.remove()
    if (err) throw new Error(err)
    if (code !== 0) throw new Error(`build exited with status ${code}`)

    return resolve(outputDir, `${crate}@${ref}.wasm`)
  }
  /** Generate the command line for the container.
   */
  getBuildCommand ({
    buildAs = 'root',
    origin  = 'git@github.com:hackbg/sienna-secret-token.git',
    ref     = 'HEAD',
    crate,
  } = {}) {
    const commands = []
    if (ref !== 'HEAD') {
      assert(origin && ref, 'to build a ref from origin, specify both')
      debug('building ref from origin...')
      commands.push('mkdir -p /contract')
      commands.push('cd /contract')
      commands.push(`git clone --recursive -n ${origin} .`) // clone the repo with submodules
      commands.push(`git checkout ${ref}`) // check out the interesting ref
      commands.push(`git submodule update`) // update submodules for the new checkout
      //commands.push(`chown -R ${buildAs} /contract`)
    }
    commands.push(`bash /entrypoint.sh ${crate} ${ref||''}`)
    //commands.push(`pwd && ls -al && mv ${crate}.wasm /output/${crate}@${ref}.wasm`)
    return commands.join(' && ')
  }

  /** Get environment variables for the container.
   */
  getBuildEnv = () =>
    [ 'CARGO_NET_GIT_FETCH_WITH_CLI=true'
    , 'CARGO_TERM_VERBOSE=true'
    , 'CARGO_HTTP_TIMEOUT=240' ]

  /** Try to upload a binary to the network but return a pre-existing receipt if one exists.
   *  TODO also code checksums should be validated
   */
  async uploadCached (artifact) {
    const receiptPath = this.getReceiptPath(artifact)
    if (existsSync(receiptPath)) {
      const receiptData = await readFile(receiptPath, 'utf8')
      info(`ℹ️  ${bold(relative(process.cwd(),receiptPath))} exists, delete to reupload`)
      return JSON.parse(receiptData)
    } else {
      return this.upload(artifact)
    }
  }

  getReceiptPath = path =>
    resolve(this.network.receipts, `${basename(path)}.upload.json`)

  /** Upload a binary to the network.
   */
  async upload (artifact) {
    const uploadResult = await this.agent.upload(artifact)
    const receiptData  = JSON.stringify(uploadResult, null, 2)
    await writeFile(this.getReceiptPath(artifact), receiptData, 'utf8')
    return uploadResult
  }
}

