<template>
  <div class="flex flex-col">
    <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
        <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Block number
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Block hash
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="block in blocks" :key="block.hash">
                <td class="px-6 py-4 whitespace-nowrap">
                    {{ block.number }}
                    </td>
                    <td>
                        {{ block.hash }}
                    </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import apiAsync from '../../connection.js'
const api = await apiAsync;

// const blocks = [
//   {
//     name: 'Jane Cooper',
//     title: 'Regional Paradigm Technician',
//     department: 'Optimization',
//     role: 'Admin',
//     email: 'jane.cooper@example.com',
//     image:
//       'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60',
//   },
//   // More people...
// ]

export default {
    data() {
        return {
            blocks: []
        }
    },
    methods: {
        async BlockSubscription() {
            await api.rpc.chain.subscribeNewHeads((header) => {
                this.blocks.unshift({
                    number:header.number.toNumber(),
                    hash: header.stateRoot
                });
            });
        }
    },  
    created() {
        this.BlockSubscription();
    }
}
</script>