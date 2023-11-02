var SelectRowNode = {
    data() {
        return {
            columns: this.component,
        }
    },
    template: `<div class="node" v-bind:id="nodeid" :class="[selected(), node.name] | kebab">
      <div class="container">
          <div class="title">{{node.name}}</div>
          <div class="row">
            <!-- Controls-->
                <div class="controls">
                    <div class="control" v-for="control in controls()" v-control="control"></div>
                </div>
                <div v-if="node.data.showAddBtn" style="display:flex;justify-content: flex-end;">
                    <button v-bind:id="unid" class="btn" @click="addCondition(event)">Add Condition</button>
                </div>

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
          </div>
      </div>
  </div>`,
    mixins: [VueRenderPlugin.default.mixin],
    components: {
        Socket: VueRenderPlugin.default.Socket
    },
    computed: {
        unid() {
            return `add-condition-${this.node.id}`;
        },
        nodeid() {
            return this.node.id;
        }
    },
    methods: {
        async addCondition(event) {
            let c_len = this.node.controls.size ? this.node.controls.size : 0;

            const dynamicSelectControl = new SelectRowControl(this.node.data.emitter, `selectrows-${this.node.id}-${c_len}`, {
                select1Options: this.node.data.options,
                select2Options: this.node.data.select2Options
            });

            this.node.addControl(dynamicSelectControl);
            await this.node.update();
        }
    }
}

class SelectRowsComponent extends Rete.Component {
    constructor(key) {
        super(`SelectRows-${key}`);
        // super(`SelectRows`);
        // this.editor = editor;
        this.data.component = SelectRowNode;
        this.conditions = {};
        this.data.columns = [];
        this.operators = [];
        this.html = "";
        this.prevInput = "";
        this.data.showAddBtn = false;
    }

    async builder(node) {
        node.data.columns = this.data.columns;
        node.data.emitter = this.editor;
        var inp1 = new Rete.Input(`table-${node.id}`, "String", strSocket);
        var out1 = new Rete.Output(`table-${node.id}`, "String", strSocket);

        if (!document.getElementById(`loader-${node.id}`)) {
            this.loader = createLoader(`loader-${node.id}`);
        }

        this.editor.on('connectionremoved', (connection) => {
            if (connection.input.node.id === node.id) {
                this.conditions = {};
                this.data.columns = [];
                this.html = "";
                node.controls.forEach(control => {
                    node.removeControl(control);
                });

            }
        });


        if (this.html !== "" && this.html.length !== 0 && this.html[0] !== "No data available") {
            node.data.html = this.html;
            if (!Array.from(node.inputs)[0]) {
                this.conditions = {};
                this.html = "";
                return node.addInput(inp1).addOutput(out1);
            }

            document.getElementById(`${node.id}`).appendChild(this.loader);
            await fetch('https://ayushtripathy.pythonanywhere.com/columns', {
                method: 'POST',
                body: this.html,
            })
                .then(response => response.json())
                .then(data => {
                    this.data.columns = data.data;
                    node.data.columns = this.data.columns;
                })
                .catch(error => {
                    console.error('Error uploading file:', error);
                });
            await node.update();

            let options = [];
            let col_operators = {};

            const requests = [];

            this.data.columns.forEach(column => {
                requests.push({
                    url: 'https://ayushtripathy.pythonanywhere.com/get_operators',
                    body: {
                        col: column,
                        html: this.html
                    }
                });
            });

            const fetchPromises = requests.map(request => {
                return fetch(request.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(request.body)
                })
                    .then(response => response.json())
                    .catch(error => console.error('Error:', error));
            });

            await Promise.all(fetchPromises)
                .then(dataArray => {
                    dataArray.forEach((data, index) => {
                        col_operators[data.col] = data.data;
                    });
                })
                .catch(error => {
                    console.error('Fetch requests failed:', error);
                }).finally(() => {
                    document.getElementById(`${node.id}`).removeChild(this.loader);
                });


            const select2Options = [];

            this.data.columns.forEach(column => {
                if (col_operators[column]) {
                    col_operators[column].forEach(operator => {
                        select2Options.push({ value: operator, label: operator, select1Value: column });
                    });
                }
            });

            this.data.columns.forEach(column => {
                options.push({ value: column, label: column });
            });

            let c_len = node.controls.length ? node.controls.length : 0;

            node.data.options = options;
            node.data.select2Options = select2Options;
            const dynamicSelectControl = new SelectRowControl(this.editor, `selectrows-${node.id}-${c_len}`, {
                select1Options: options,
                select2Options: select2Options
            });

            if (node.controls.has(`selectrows-${node.id}-${c_len}`)) {
                node.controls.forEach(control => {
                    node.removeControl(control);
                });
            }
            else {
                node.addControl(dynamicSelectControl);
            }
            node.data.showAddBtn = true;
            let c_node = this.editor.nodes.find(n => n.id == node.id);

            this.editor.on('process', data => {
                const condition = Object.entries(data);

                // Check if this process event is for this node
                if (condition[0] === undefined) return;
                const [key, value] = condition[0];

                if (key.split("-")[0] != "select-rows" && key.split("-")[1] != node.id) {
                    return;
                }

                if (this.conditions.hasOwnProperty(key)) {

                    let related_to_1_values = [];
                    select2Options.forEach(option => {
                        if (option.select1Value === value["select1Value"]) {
                            related_to_1_values.push(option.value);
                        }
                    });

                    if (!related_to_1_values.includes(value["select2Value"])) {
                        delete this.conditions[key];
                    }
                    else {
                        if (this.conditions[key]["textInputValue"] === "") {
                            delete this.conditions[key];
                        }
                        else {
                            this.conditions[key] = value;
                        }
                    }
                }
                else {
                    this.conditions[key] = value;
                }
            });

            node.data.dynamicSelectControl = dynamicSelectControl;

            await node.update();

            if (Array.from(node.inputs)[0][0].split("-")[0] != "table") {
                return node.addInput(inp1).addOutput(out1);
            }
            else {
                return node;
            }

        }
        else {
            if (!Array.from(node.inputs)[0]) {
                return node.addInput(inp1).addOutput(out1);
            }

            if (Array.from(node.inputs)[0][0].split("-")[0] !== "table") {
                return node.addInput(inp1).addOutput(out1);
            }
            else {
                return node;
            }
        }
    }

    async worker(node, inputs, outputs) {

        let conditions_list = [];

        let o_keys = Object.keys(this.conditions);
        for (let key of o_keys) {
            let condition = [];
            condition.push(this.conditions[key]["select1Value"]);
            condition.push(this.conditions[key]["select2Value"]);

            if (this.conditions[key]["textInputValue"] === "") {
                delete this.conditions[key]
                continue;
            }
            condition.push(this.conditions[key]["textInputValue"]);
            conditions_list.push(condition);
        }

        if (inputs[`table-${node.id}`][0] !== this.prevInput[0]) {
            this.prevInput = inputs[`table-${node.id}`];
            this.html = inputs[`table-${node.id}`];

            if (this.html === "No data available") {
                this.html = "";
            }

            let c_node = this.editor.nodes.find(n => n.id == node.id);
            this.builder(c_node);

            if (!this.objectsAreEqual(this.conditions, {}) && this.html !== "" && this.html.length !== 0 && this.html[0] !== "No data available") {

                outputs[`table-${node.id}`] = "Fetching data...";
                document.getElementById(`${node.id}`).appendChild(this.loader);
                await fetch('https://ayushtripathy.pythonanywhere.com/select_rows', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        conditions: conditions_list,
                        html: this.html
                    })
                }).then(response => response.json())
                    .then(data => {
                        outputs[`table-${node.id}`] = data.data;
                    }).catch(error => {
                        console.error('Error :', error);
                    }).finally(() => {
                        document.getElementById(`${node.id}`).removeChild(this.loader);
                    });
            }
            else {
                outputs[`table-${node.id}`] = this.html;
            }
        }
        else {

            if (!this.objectsAreEqual(this.conditions, {}) && this.html !== "" && this.html.length !== 0 && this.html[0] !== "No data available") {
                outputs[`table-${node.id}`] = "Fetching data...";
                document.getElementById(`${node.id}`).appendChild(this.loader);
                await fetch('https://ayushtripathy.pythonanywhere.com/select_rows', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        conditions: conditions_list,
                        html: this.html
                    })
                }).then(response => response.json())
                    .then(data => {
                        outputs[`table-${node.id}`] = data.data;
                    }).catch(error => {
                        console.error('Error :', error);
                    }).finally(() => {
                        document.getElementById(`${node.id}`).removeChild(this.loader);
                    });
            }
            else {
                outputs[`table-${node.id}`] = this.html;
            }

        }
    }

    objectsAreEqual(objA, objB) {
        const keysA = Object.keys(objA);
        const keysB = Object.keys(objB);

        if (keysA.length !== keysB.length) {
            return false;
        }

        for (let key of keysA) {
            if (objA[key] !== objB[key]) {
                return false;
            }
        }
        return true;
    }

}