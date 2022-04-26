// import { ApiPromise, WsProvider } from '@polkadot/api';

// const wsProvider = new WsProvider("wss://rpc.polkadot.io");
// let api = ApiPromise.create({ provider: wsProvider });

// //const util = require("@polkadot/util");
// export default api;

import { ApiPromise, WsProvider } from '@polkadot/api';

// const wsProvider = new WsProvider("wss://rpc.polkadot.io");
const wsProvider = new WsProvider("wss://testnode3.unique.one/wsapi");
let api = ApiPromise.create({ provider: wsProvider });

//const util = require("@polkadot/util");
export default api;

// const connect = () => {
//     // const provider = new WsProvider("wss://dev-node.substrate.dev");
//     const provider = new WsProvider("ws://127.0.0.1:9944");

//     const _api = new ApiPromise({ provider: wsProvider });

//     _api.on('connected', () => {
//         _api.isReady.then((_api) => console.log("API connected"));
//       });
//       _api.on('ready', () => console.log("API ready"));
//       _api.on('error', err => console.log("API error"));
// };

// export default _api;