<template>
    <div>
        <h2 class="text-3xl font-bold underline">BLOCK DETAIL</h2>
    </div>
    <div>
        Basic informations : chain : {{ basicInfo.chain }} / name : {{ basicInfo.name }} / version : {{ basicInfo.version }}
    </div>
    <div>
        <h1>Salut de block</h1>
        <p>genesisHash = {{ genesisHash }}</p>
        <br />
        <p>Current block 2 {{ currentBlock }}</p>
        <br />
        <p>Alice account {{ aliceAccountValue }}</p>
        <br />
        <p>Blocknumber {{ blocknumber }}</p>
    </div>
</template>
<script>
import { ApiPromise, WsProvider } from '@polkadot/api';
import apiAsync from '../../connection.js'

const api = await apiAsync;
// const wsProvider = new WsProvider('wss://rpc.polkadot.io');
// const wsProvider = new WsProvider('ws://127.0.0.1:9944');
// const api = await ApiPromise.create({ provider: wsProvider });


api.rpc.chain.getBlock().then((block) => {
    console.log("Block App.vue : " + block.block.header.number.toNumber());
});

await api.rpc.chain.getBlock((block) => {
    console.log("Block App.vue 2 : " + block.block.header.number.toNumber());
});

const unsubscribe = await api.rpc.chain.subscribeNewHeads((header) => {
    //console.log(`Chain is at block: #${header.number}`);
    //vm.$data.currentBlock = header.number;
  });

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

export default {
    data() {
        return {
            greeting : "Hello",
            genesisHash: null,
            currentBlock : null,
            aliceAccountValue : 0,
            blocknumber : 0,
            basicInfo: {
                chain: null,
                name : null,
                version : null
            }
        }
    },
    methods: {
        async BasicInfo() {
            const [chain, nodeName, nodeVersion] = await Promise.all([
                api.rpc.system.chain(),
                api.rpc.system.name(),
                api.rpc.system.version()
            ]);
            this.basicInfo.chain = chain;
            this.basicInfo.name = nodeName;
            this.basicInfo.version = nodeVersion;
        },
        TestBlock() {
            this.genesisHash = api.genesisHash.toHex();
            //this.aliceAccountValue = await api.query.system.account(ALICE);
        },
        MaFonction() {
            console.log("synchrone : " + this.greeting);
        },
        async MaFonctionAsync() {
            console.log("Async : " + this.greeting);
        },
        MaFonctionAsync2 : async() => {
            console.log("Async 2 : " + this.greeting);
        },
        async CurrentHeadBlock() {
            await api.rpc.chain.subscribeNewHeads((header) => {
                this.currentBlock = header.number.toNumber();
            });
        },
        async BlockInc2() {
            // this.currentBlock = "DEBUT";
            // var i = 0;
            // await api.rpc.chain.subscribeNewHeads((header) => {
            //     i++;
            //     this.currentBlock = header.number.toNumber();
            //     //this.$el.textContent = "FIN";
            //     //xx = header.number;
            //     //xx.pwet(4);
            //     console.log(`INSIDE METHOD 2 ! > Chain is at block: #${header.number}`);
            // });
        },
        pwet(newVal) {
            console.log(newVal);
        },
        getBlockNumber() {
            // api.rpc.chain.subscribeNewHeads().then((header) => {
            //     this.blocknumber = header.number;
            // });
        }
    },
    created() {
        this.BasicInfo();
        this.TestBlock();
        this.CurrentHeadBlock();
        this.MaFonction();
        this.MaFonctionAsync();
        this.BlockInc2();
        this.getBlockNumber();
    }
}
</script>