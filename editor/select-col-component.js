class SelectColumnComponent extends Rete.Component {
    constructor(key) {
        super(`SelectColumn-${key}`);
        // super(`SelectColumn`);
        // this.editor = editor;
        this.data.component = CustomNode;
        this.columns = "";
        this.html = "";
        this.prevInput = "";
        this.selectedColumns = [];
    }

    async builder(node) {
        var inp1 = new Rete.Input(`table-${node.id}`, "String", strSocket);
        var out1 = new Rete.Output(`table-${node.id}`, "String", strSocket);
        if (!document.getElementById(`loader-${node.id}`)) {
            this.loader = createLoader(`loader-${node.id}`);
        }

        this.editor.on('connectionremoved', (connection) => {
            if (connection.input.node.id == node.id) {
                this.selectedColumns = [];
                this.html = "";
                node.controls.forEach(control => {
                    node.removeControl(control);
                });
            }
        });


        if (this.html !== "") {
            if (!Array.from(node.inputs)[0]) {
                this.selectedColumns = [];
                this.html = "";
                return node.addInput(inp1).addOutput(out1);
            }

            document.getElementById(`${node.id}`).appendChild(this.loader);
            // console.log("loader: ", document.getElementById(`${node.id}`));
            await fetch('https://ayushtripathy.pythonanywhere.com/columns', {
                method: 'POST',
                body: this.html,
            })
                .then(response => response.json())
                .then(data => {
                    this.columns = data.data;
                    this.columns.forEach(column => {
                        node.controls.has(`${column}-${node.id}`) ? null : node.addControl(new SelectColumnControl(this.editor, `${column}-${node.id}`, column, false));;
                    });

                })
                .catch(error => {
                    console.error('Error uploading file:', error);
                }).finally(() => {
                    document.getElementById(`${node.id}`).removeChild(this.loader);
                });
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

            if (Array.from(node.inputs)[0][0].split("-")[0] != "table") {
                return node.addInput(inp1).addOutput(out1);
            }
            else {
                return node;
            }
        }
    }

    async worker(node, inputs, outputs) {
        if (inputs[`table-${node.id}`][0] != this.prevInput[0]) {
            this.prevInput = inputs[`table-${node.id}`];
            this.html = inputs[`table-${node.id}`];

            let c_node = this.editor.nodes.find(n => n.id == node.id);
            this.builder(c_node);


            c_node.controls.forEach(control => {
                if (control.getValue()) {
                    let column = control.key.split("-")[0];
                    if (!this.selectedColumns.includes(column)) {
                        this.selectedColumns.push(column);
                    }
                }
                else {
                    this.selectedColumns = this.selectedColumns.filter(item => item !== control.key.split("-")[0]);
                }
            });

            if (this.selectedColumns.length !== 0) {
                outputs[`table-${node.id}`] = "Fetching data...";
                document.getElementById(`${node.id}`).appendChild(this.loader);
                await fetch('https://ayushtripathy.pythonanywhere.com/select_columns', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cols: this.selectedColumns,
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
                outputs[`table-${node.id}`] = "No data available";
            }
        }
        else {
            let c_node = this.editor.nodes.find(n => n.id == node.id);

            c_node.controls.forEach(control => {
                if (control.getValue()) {
                    let column = control.key.split("-")[0];
                    if (!this.selectedColumns.includes(column)) {
                        this.selectedColumns.push(column);
                    }
                }
                else {
                    this.selectedColumns = this.selectedColumns.filter(item => item !== control.key.split("-")[0]);
                }
            });

            if (this.selectedColumns.length !== 0) {
                outputs[`table-${node.id}`] = "Fetching data...";
                document.getElementById(`${node.id}`).appendChild(this.loader);
                await fetch('https://ayushtripathy.pythonanywhere.com/select_columns', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cols: this.selectedColumns,
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
                outputs[`table-${node.id}`] = "No data available";
            }
        }
    }
}