var CustomInfoNode = {
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
            return 'info-' + this.node.id;
        }
    }
}

class InfoComponent extends Rete.Component {
    constructor(key) {
        super(`Info-${key}`);
        this.data.component = CustomInfoNode;
        this.html = "";
        this.prevHtml = this.html;
    }

    builder(node) {
        if (!document.getElementById(`loader-${node.id}`)) {
            this.loader = createLoader(`loader-${node.id}`);
        }

        var inp1 = new Rete.Input('table', "String", strSocket);
        return node.addInput(inp1);
    }

    async worker(node, inputs, outputs) {
        this.html = inputs["table"][0];
        if (this.html === this.prevHtml) {
            return;
        }

        this.prevHtml = this.html;
        if (this.html !== undefined) {
            document.getElementById(`info-${node.id}`).appendChild(this.loader);
            await fetch("http://localhost:5000/get_info", {
                method: "POST",
                body: this.html
            })
                .then(response => response.json())
                .then(data => {
                    node.data.info = data.data;
                })
                .catch(err => console.error(err))
                .finally(() => {
                    document.getElementById(`info-${node.id}`).removeChild(this.loader);
                });
        }
    }
}