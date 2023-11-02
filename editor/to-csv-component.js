var CustomCSVNode = {
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
            return 'tocsv-' + this.node.id;
        }
    }
}

class ToCSVComponent extends Rete.Component {
    constructor(key) {
        super(`To CSV-${key}`);
        this.data.component = CustomCSVNode;
        this.html = "";
        this.prevHtml = this.html;
        this.blob = null;
        this.prevDownloadBtnItems = null;
    }

    builder(node) {
        if (!document.getElementById(`loader-${node.id}`)) {
            this.loader = createLoader(`loader-${node.id}`);
        }

        if (this.blob !== null) {
            var el = document.getElementById(`tocsv-${node.id}`);

            if (this.prevDownloadBtnItems !== null) {
                this.prevDownloadBtnItems.forEach(element => {
                    el.removeChild(element);
                });
            }

            const url = window.URL.createObjectURL(this.blob);
            const a = document.createElement('a');
            a.id = `tocsv-dbtn-${node.id}`;
            a.innerHTML = "Download";
            a.href = url;
            a.download = 'file.csv';
            a.className = 'to-csv-download-btn';

            const div1 = document.createElement('div');
            div1.style = "height: 10px";
            const div2 = document.createElement('div');
            div2.style = "height: 10px";

            this.editor.on('connectionremoved', (connection) => {
                if (connection.input.node.id == node.id) {
                    el.removeChild(a);
                    el.removeChild(div1);
                    el.removeChild(div2);
                }
            });

            el.appendChild(div1);
            el.appendChild(a);
            el.appendChild(div2);

            this.prevDownloadBtnItems = [a, div1, div2];
            // window.URL.revokeObjectURL(url);

        }
        else {
            var inp1 = new Rete.Input('table', "String", strSocket);
            return node.addInput(inp1);
        }


    }

    async worker(node, inputs, outputs) {
        this.html = inputs["table"][0];
        if (this.html === this.prevHtml) {
            return;
        }

        this.prevHtml = this.html;
        if (this.html !== undefined) {
            document.getElementById(`tocsv-${node.id}`).appendChild(this.loader);
            await fetch("https://ayushtripathy.pythonanywhere.com/to_csv", {
                method: "POST",
                body: this.html
            })
                .then(response => response.blob())
                .then(blob => {
                    this.blob = blob;

                    let c_node = this.editor.nodes.find(n => n.id == node.id);
                    this.builder(c_node);
                })
                .catch(err => console.error(err))
                .finally(() => {
                    document.getElementById(`tocsv-${node.id}`).removeChild(this.loader);
                });
        }
    }
}