var CustomDisplayNode = {
    template: `<div class="node" v-bind:id="nodeCustomId" ondblclick="openDisplayModal(event)" :class="[selected(), node.name] | kebab">
          <div class="title">{{node.name}}</div>
          
            <!-- Controls-->
                <div class="control" v-for="control in controls()" v-control="control"></div>
              
  
            <!-- Outputs-->
                <div class="output" v-for="output in outputs()" :key="output.key">
                    <div class="output-title">{{output.name}}</div>
                    <Socket v-socket:output="output" type="output" :socket="output.socket"></Socket>
                </div>

            <!-- Inputs-->
                <div class="input" v-for="input in inputs()" :key="input.key">
                    <Socket v-socket:input="input" type="input" :socket="input.socket"></Socket>
                    <div class="input-title" v-show="!input.showControl()">{{input.name}}</div>
                    <div class="input-control" v-show="input.showControl()" v-control="input.control"></div>
                </div>
  </div>`,
    mixins: [VueRenderPlugin.default.mixin],
    components: {
        Socket: VueRenderPlugin.default.Socket
    },
    computed: {
        nodeCustomId: function () {
            return 'd-' + this.node.id;
        }
    }
}

class DisplayComponent extends Rete.Component {
    constructor(key) {
        super(`Display-${key}`);
        this.data.component = CustomDisplayNode;
        this.table = ""
    }

    builder(node) {
        node.data.table = this.table;
        var inp1 = new Rete.Input('table', "String", strSocket);
        return node.addInput(inp1);
    }

    worker(node, inputs, outputs) {
        node.data.table = inputs["table"];
    }
}