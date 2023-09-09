import { KEY_SERVER } from '../config'

export class WebProver {
    cache = {}

    constructor(serverUrl = KEY_SERVER) {
        this.url = serverUrl.endsWith('/') ? serverUrl : `${serverUrl}/`
    }

    async getKey(circuitUrl) {
        if (this.cache[circuitUrl]) return this.cache[circuitUrl]
        const res = fetch(circuitUrl).then((r) => r.arrayBuffer())
        this.cache[circuitUrl] = res
        return res
    }

    /**
    Use this to load keys when you know a proof will be made in the near future.
  **/
    async warmKeys(circuitName) {
        const wasmUrl = new URL(`${circuitName}.wasm`, this.url).toString()
        const zkeyUrl = new URL(`${circuitName}.zkey`, this.url).toString()
        await Promise.all([this.getKey(wasmUrl), this.getKey(zkeyUrl)])
    }

    async verifyProof(circuitName, publicSignals, proof) {
        const _snarkjs = import('snarkjs')
        const url = new URL(`${circuitName}.vkey.json`, this.url).toString()
        const vkeyBuffer = await this.getKey(url)
        const vkeyString = String.fromCharCode.apply(
            null,
            new Uint8Array(vkeyBuffer)
        )
        const vkey = JSON.parse(vkeyString)
        const snarkjs = await _snarkjs
        return snarkjs.groth16.verify(vkey, publicSignals, proof)
    }

    async genProofAndPublicSignals(circuitName, inputs) {
        const _snarkjs = import('snarkjs')
        const wasmUrl = new URL(`${circuitName}.wasm`, this.url).toString()
        const zkeyUrl = new URL(`${circuitName}.zkey`, this.url).toString()
        const [wasm, zkey] = await Promise.all([
            this.getKey(wasmUrl),
            this.getKey(zkeyUrl),
        ])
        const snarkjs = await _snarkjs
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            inputs,
            new Uint8Array(wasm),
            new Uint8Array(zkey)
        )
        return { proof, publicSignals }
    }

    async getVKey(circuitName) {
        const url = new URL(`${circuitName}.vkey.json`, this.url).toString()
        const vkeyBuffer = await this.getKey(url)
        const vkeyString = String.fromCharCode.apply(
            null,
            new Uint8Array(vkeyBuffer)
        )
        return JSON.parse(vkeyString)
    }
}

export default new WebProver()
