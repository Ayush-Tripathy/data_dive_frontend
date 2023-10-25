class FileComponent extends Rete.Component {
    constructor(key) {
        super(`File-${key}`);
        // super(`File`);
        // this.editor = editor;
        this.data.component = CustomNode;
        this.prevFile = "";
        this.output = "";
    }

    builder(node) {
        var out1 = new Rete.Output(`file-${node.id}`, "String", strSocket);
        return node.addControl(new FileControl(this.editor, `file-${node.id}`)).addOutput(out1);
    }

    async worker(node, inputs, outputs) {
        if (node.data[`file-${node.id}`]) {

            if (node.data[`file-${node.id}`] == this.prevFile) {
                outputs[`file-${node.id}`] = this.output;
                return;
            }

            this.prevFile = node.data[`file-${node.id}`];
            const formData = new FormData();
            formData.append('file', node.data[`file-${node.id}`]);

            await fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    console.log(`File uploaded successfully: ${node.id}`);
                    alert('File uploaded successfully.');
                    this.output = data.data;
                    outputs[`file-${node.id}`] = this.output;
                    //document.getElementById("res").innerHTML = data.data;
                })
                .catch(error => {
                    console.error('Error uploading file:', error);
                    alert("Error uploading file, something went wrong or the file is not yet supported.");
                });
        } else {
            console.error('No file selected.');
        }
    }
}