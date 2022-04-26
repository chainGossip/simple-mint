<template>
   <div class="home">
    <div class="btn_wallet_layout">
    </div>
    <h1 class="home_title">Single Mint</h1>
    <div class="home_control">
      <div class="form_select_group">
        <div class="form_group">
          <select @change="onPalletsChange($event)" v-model="palletRPC">
            <option v-for = "a in palletRPCs" v-bind:key="a">{{a.key}}</option>
          </select>
          <div ></div>
          <!-- <v-select :options="['Canada', 'United States']"></v-select> -->
        </div>
        <div class="form_group">
          <select @change="onCallablesChange($event)" v-model="key">
            <option v-for = "a in callables" v-bind:key="a">{{a.key}}</option>
          </select>
        </div>
      </div>
      <div class="form_input_group">
        <div class="form_group" v-for="(a, index) in paramFields" v-bind:key="(a, index)">
          <span>{{a.name}}</span>
          <input type="text" @change="onChange($event)" v-bind:name="index" v-bind:placeholder="a.type" />
        </div>
      </div>
      <button class="btn_mint" @click="handleBtn">Mint</button>
    </div>
  </div>
</template>
<script>
import { ApiPromise, WsProvider } from '@polkadot/api';
import apiAsync from '../../connection.js'
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp'
import { keyring as Keyring } from '@polkadot/ui-keyring'
import { isTestChain } from '@polkadot/util'
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { web3FromSource } from '@polkadot/extension-dapp'

import utils from '../utils'
const api = await apiAsync;

export default {
    data() {
        return {
            interxType: "EXTRINSIC",
            palletRPCs : [],
            callables : [],
            paramFields : [],
            palletRpc: '',
            callable: '',
            inputParams: [],
            paramSet: [],
            keyring: {},
            currentAccount: [],
        }
    },
    methods: {
      async retrieveChainInfo() {
          const [systemChain, systemChainType] = await Promise.all([
              api.rpc.system.chain(),
              api.rpc.system.chainType ?
              api.rpc.system.chainType() :
              Promise.resolve(registry.createType('ChainType', 'Live')),
          ])
          return {
              systemChain: (systemChain || '<unknown>').toString(),
              systemChainType,
          }
      },
        loadAccount() {
          const asyncLoadAccounts = async() => {
            try {
                await web3Enable("SimpleMint")
                let allAccounts = await web3Accounts()

                allAccounts = allAccounts.map(({ address, meta }) => ({
                    address,
                    meta: {...meta, name: `${meta.name} (${meta.source})` },
                }))

                // Logics to check if the connecting chain is a dev chain, coming from polkadot-js Apps
                // ref: https://github.com/polkadot-js/apps/blob/15b8004b2791eced0dde425d5dc7231a5f86c682/packages/react-api/src/Api.tsx?_pjax=div%5Bitemtype%3D%22http%3A%2F%2Fschema.org%2FSoftwareSourceCode%22%5D%20%3E%20main#L101-L110
                const { systemChain, systemChainType } = await this.retrieveChainInfo(api)
                const isDevelopment =
                    systemChainType.isDevelopment ||
                    systemChainType.isLocal ||
                     isTestChain(systemChain)

                Keyring.loadAll({
                    isDevelopment,
                  },
                  allAccounts
                )
                console.log(Keyring)
                this.keyring = Keyring;
                 const keyringOptions = Keyring.getPairs().map(account => ({
                key: account.address,
                value: account.address,
                text: account.meta.name.toUpperCase(),
                icon: 'user',
              }))

              const initialAddress =
                keyringOptions.length > 0 ? keyringOptions[0].value : '';
              this.currentAccount = Keyring.getPair(initialAddress)
              console.log(this.currentAccount)
            } catch (e) {
                console.error(e)
            }
        }
        asyncLoadAccounts()
        },
        async handleBtn() {
          if(this.paramSet == []) 
            return
          this.loadAccount();
           const fromAcct = await this.getFromAcct();
           console.log(this.paramSet)

          const transformed = this.transformParams(this.paramFields, this.paramSet)
          // transformed can be empty parameters

          const txExecute = transformed
            ? api.tx[this.palletRpc][this.callable](...transformed)
            : api.tx[this.palletRpc][this.callable]()

          const unsub = await txExecute
            .signAndSend(...fromAcct, txResHandler)
            .catch(txErrHandler)

          setUnsub(() => unsub)
        },
        transformParams(
          paramFields,
          inputParams,
          opts = { emptyAsNull: true }
        ) {
          // if `opts.emptyAsNull` is true, empty param value will be added to res as `null`.
          //   Otherwise, it will not be added
          const paramVal = inputParams.map(inputParam => {
            // To cater the js quirk that `null` is a type of `object`.
            if (
              typeof inputParam === 'object' &&
              inputParam !== null &&
              typeof inputParam.value === 'string'
            ) {
              return inputParam.value.trim()
            } else if (typeof inputParam === 'string') {
              return inputParam.trim()
            }
            return inputParam
          })
          const params = paramFields.map((field, ind) => ({
            ...field,
            value: paramVal[ind] || null,
          }))

          return params.reduce((memo, { type = 'string', value }) => {
            if (value == null || value === '')
              return opts.emptyAsNull ? [...memo, null] : memo

            let converted = value

            // Deal with a vector
            if (type.indexOf('Vec<') >= 0) {
              converted = converted.split(',').map(e => e.trim())
              converted = converted.map(single =>
                this.isNumType(type)
                  ? single.indexOf('.') >= 0
                    ? Number.parseFloat(single)
                    : Number.parseInt(single)
                  : single
              )
              return [...memo, converted]
            }

            // Deal with a single value
            if (this.isNumType(type)) {
              converted =
                converted.indexOf('.') >= 0
                  ? Number.parseFloat(converted)
                  : Number.parseInt(converted)
            }
            return [...memo, converted]
          }, [])
        },
        async getFromAcct() {
          const {
            address,
            meta,
          } = this.currentAccount

          // if (!isInjected) {
          //   return [currentAccount]
          // }
          console.log(this.currentAccount)
          // currentAccount is injected from polkadot-JS extension, need to return the addr and signer object.
          // ref: https://polkadot.js.org/docs/extension/cookbook#sign-and-send-a-transaction
          const injector = await web3FromSource("polkadot-js")
          console.log(injector)
          return [address, { signer: injector.signer }]
        },
        isNumType(type) {
          return utils.paramConversion.num.some(el => type.indexOf(el) >= 0)
        },
        onChange(e) {
          this.paramSet[parseInt(e.target.name)] = e.target.value
        },
        onPalletsChange(e) {
          this.palletRpc = e.target.value
          this.updateCallables();
          this.paramSet = []
        },
        onCallablesChange(e) {
          this.callable = e.target.value
          this.updateParamFields()
          this.paramSet = []
        },
        getApiType() {
            if (this.interxType === 'QUERY') {
            return api.query
            } else if (this.interxType === 'EXTRINSIC') {
            return api.tx
            } else if (this.interxType === 'RPC') {
            return api.rpc
            } else {
            return api.consts
            }
        },
        updatePalletRPCs() {
            if (!api) {
            return
            }
            const apiType = this.getApiType(api, this.interxType)
            const palletRPCs = Object.keys(apiType)
            .sort()
            .filter(pr => Object.keys(apiType[pr]).length > 0)
            .map(pr => ({ key: pr, value: pr, text: pr }))
            console.log(palletRPCs)
            this.palletRPCs = palletRPCs
            this.palletRpc = palletRPCs[0].key
            this.updateCallables()
        },
        updateCallables() {
            if (!api || this.palletRpcs === []) {
            return
            }
            const callables = Object.keys(this.getApiType(api, this.interxType)[this.palletRpc])
            .sort()
            .map(c => ({ key: c, value: c, text: c }))
            this.callables = callables
            this.updateParamFields()
        },
        updateParamFields() {
          console.log("updateParam")
            if (!api || this.palletRpc === '' || this.callable === '') {
            this.paramFields = []
            return
            }

            let paramFields = []

            if (this.interxType === 'QUERY') {
            const metaType = api.query[this.palletRpc][this.callable].meta.type
            if (metaType.isPlain) {
                // Do nothing as `paramFields` is already set to []
            } else if (metaType.isMap) {
                paramFields = [
                {
                    name: metaType.asMap.key.toString(),
                    type: metaType.asMap.key.toString(),
                    optional: false,
                },
                ]
            } else if (metaType.isDoubleMap) {
                paramFields = [
                {
                    name: metaType.asDoubleMap.key1.toString(),
                    type: metaType.asDoubleMap.key1.toString(),
                    optional: false,
                },
                {
                    name: metaType.asDoubleMap.key2.toString(),
                    type: metaType.asDoubleMap.key2.toString(),
                    optional: false,
                },
                ]
            }
            } else if (this.interxType === 'EXTRINSIC') {
            const metaArgs = api.tx[this.palletRpc][this.callable].meta.args

            if (metaArgs && metaArgs.length > 0) {
                paramFields = metaArgs.map(arg => ({
                name: arg.name.toString(),
                type: arg.type.toString(),
                }))
            }
            } else if (this.interxType === 'RPC') {
            let metaParam = []

            if (jsonrpc[this.palletRpc] && jsonrpc[this.palletRpc][this.callable]) {
                metaParam = jsonrpc[this.palletRpc][this.callable].params
            }

            if (metaParam.length > 0) {
                paramFields = metaParam.map(arg => ({
                name: arg.name,
                type: arg.type,
                optional: arg.isOptional || false,
                }))
            }
            } else if (this.interxType === 'CONSTANT') {
            paramFields = []
            }

            this.paramFields = paramFields;
            this.paramSet.fill(0, 0, this.paramFields.length - 1)
        },
      
    },
    mounted() {
      this.updatePalletRPCs()
      // this.updateCallables()
    },
    created() {
       this.updatePalletRPCs()
      //  this.updateCallables()
    }
}
</script>

<style>
.home_control {
  text-align: center;
  margin: 0 auto;
  max-width: -webkit-fit-content;
  max-width: -moz-fit-content;
  max-width: fit-content;
  border: 1px solid grey;
  border-radius: 25px;
  padding: 17px 25px;
  background: #12101040;
}
.home input {
  width: 280px;
}
.home select {
  width: 320px;
}
.form_group {
  margin: 20px 0px;
}
input,
select {
  border: 1px solid #607d8b;
  border-radius: 4px;
  padding: 5px 20px;
  background: transparent;
  font-size: 22px;
  color: white;
}
select option {
  background: #1c1c1c !important;
}
.home_title {
  color: white;
  text-align: center;
  animation: glow 2s ease-in-out infinite alternate;
}
@keyframes glow {
  from {
    text-shadow: 0 0 20px #f7f6f4;
  }
  to {
    text-shadow: 0 0 30px #3cba8b, 0 0 10px #3cba8b;
  }
}
.form_select_group {
  padding: 0px 32px;
}
.form_input_group {
  background: #0c0c0c5c;
  padding: 14px 0px;
  border-radius: 24px;
}
.home_control {
  margin: 0 auto;
  max-width: fit-content;
  border: 1px solid grey;
  padding: 10px 2.8% 26px;
  border-radius: 30px;
}
.btn_wallet_layout {
  text-align: right;
  height: 100px;
}
body {
background: #706e6e;
}
.btn_wallet {
  background: #80115e;
  border-radius: 4px;
  font-size: 22px;
  font-weight: 800;
  padding: 10px 20px;
  margin-top: 20px;
  border: none;
  color: white;
  cursor: pointer;
}
.btn_mint {
  background: #673ab7;
  border-radius: 4px;
  font-size: 22px;
  font-weight: 800;
  padding: 10px 20px;
  margin-top: 20px;
  border: none;
  color: white;
  cursor: pointer;
}
</style>