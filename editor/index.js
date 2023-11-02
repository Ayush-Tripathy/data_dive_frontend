const createLoader = (id) => {
    const loader = document.createElement("div");
    loader.id = id;
    loader.innerHTML = `<div class="spinner center">
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    </div>`;
    return loader;
}

const loader = createLoader("main-loader-1");
const overlay = document.getElementById('overlay');
overlay.appendChild(loader);
(async () => {
    await fetch('https://ayushtripathy.pythonanywhere.com/', {
        method: 'GET'
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            overlay.style.display = "none";
        }).catch(err => {
            console.error(err);
            alert("Our server is experiencing some problem, please try again later.");
            window.location.href = '../homepage/index.html';
        }).finally(() => overlay.removeChild(loader));
})();

var numSocket = new Rete.Socket("Number");
var strSocket = new Rete.Socket("String");

var modalCloseListenerRef = null;

function openDisplayModal(event) {
    let n_ = event.target.closest(".node").id.split("-")
    let nodeName = n_[0];
    let nodeId = n_[1];
    let node = editor.nodes.find(n => n.id == nodeId);

    document.getElementById("display-modal").style.display = "block";
    if (nodeName === "d") {
        document.getElementById("display-modal-content").innerHTML = node.data.table;
    }
    else if (nodeName === "info") {
        if (node.data.info !== undefined) {
            var content = `<div style="height: 100%;display: flex;align-items: center;justify-content: center">
                       Rows: ${node.data.info.rows}
                       <br />
                       Columns: ${node.data.info.cols}
                       </div>`
            document.getElementById("display-modal-content").innerHTML = content;
        }
    }
    modalCloseListenerRef = document.getElementById("display-modal-close").addEventListener("click", closeDisplayModal);
}

function closeDisplayModal() {
    document.getElementById("display-modal-content").innerHTML = "";
    document.getElementById("display-modal").style.display = "none";
    document.getElementById("display-modal-close").removeEventListener("click", modalCloseListenerRef);
    modalCloseListenerRef = null;
}

var components = [
    new FileComponent(1),
    // new DisplayComponent(),
    // new SelectColumnComponent(102),
    // new SelectRowsComponent(1)
];

var container = document.getElementById("rete");
var editor = new Rete.NodeEditor("ddive@0.1.0", container);
editor.use(VueRenderPlugin.default);
editor.use(ConnectionPlugin.default);
// editor.use(ContextMenuPlugin.default);
editor.use(AreaPlugin);
editor.use(CommentPlugin.default);
editor.use(HistoryPlugin);
editor.use(ConnectionMasteryPlugin.default);

var engine = new Rete.Engine('ddive@0.1.0');

(async () => {
    components.map(c => {
        editor.register(c);
        engine.register(c);
    });

    var file = await components[0].createNode();

    file.position = [0, 0];

    editor.addNode(file);

    editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
        console.log('process');
        await engine.abort();
        await engine.process(editor.toJSON());
    });

    editor.on('nodeselected', (node) => {
        // console.log("nodeID: ", node.id);
        // if (node.name == "Display") {
        //     openDisplayModal(node);
        //     document.getElementById("res").innerHTML = node.data.table[0];
        // }
    });

    editor.on('zoom', ({ source }) => {
        return source !== 'dblclick';
    });

    editor.on('noderemoved', (node) => {
        console.log(node);
    });

    editor.view.resize();
    AreaPlugin.zoomAt(editor);
    editor.trigger('process');
})();



var mobile_item_selec = '';
var mobile_last_move = null;
function positionMobile(event) {
    mobile_last_move = event;
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    if (ev.type === "touchstart") {
        mobile_item_selec = ev.target.closest(".drag-dnode").getAttribute('data-node');
    } else {
        ev.dataTransfer.setData("node", ev.target.getAttribute('data-node'));
    }
}

function drop(ev) {
    if (ev.type === "touchend") {
        var parent = document.elementFromPoint(mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY).closest("#rete");
        if (parent != null) {
            addNodeToEditor(mobile_item_selec, mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY);
        }
        mobile_item_selec = '';
    } else {
        ev.preventDefault();
        var data = ev.dataTransfer.getData("node");
        addNodeToEditor(data, ev.clientX, ev.clientY);
    }

}

async function addNodeToEditor(name, pos_x, pos_y) {
    // console.log(name, pos_x, pos_y);
    let transform = editor.view.area.transform;

    // Calculate the node position in the editor coordinate system
    pos_x = (pos_x - transform.x) / transform.k;
    pos_y = (pos_y - transform.y) / transform.k;
    let pos = [pos_x, pos_y];

    let key = editor.nodes.length + 1;
    let newNode;
    switch (name) {
        case 'display':
            var displayComponent = new DisplayComponent(key);
            editor.register(displayComponent);
            engine.register(displayComponent);
            newNode = await displayComponent.createNode();
            newNode.position = pos;
            editor.addNode(newNode);
            break;

        case 'file':
            var fileComponent = new FileComponent(key);
            editor.register(fileComponent);
            engine.register(fileComponent);
            newNode = await fileComponent.createNode();
            newNode.position = pos;
            editor.addNode(newNode);
            break;

        case 'select_col':
            var selectColumnComponent = new SelectColumnComponent(key);
            editor.register(selectColumnComponent);
            engine.register(selectColumnComponent);
            newNode = await selectColumnComponent.createNode();
            newNode.position = pos;
            editor.addNode(newNode);
            break;

        case 'select_rows':
            var selectRowsComponent = new SelectRowsComponent(key);
            editor.register(selectRowsComponent);
            engine.register(selectRowsComponent);
            newNode = await selectRowsComponent.createNode();
            newNode.position = pos;
            editor.addNode(newNode);
            break;

        case 'info':
            let infoComponent = new InfoComponent(key);
            editor.register(infoComponent);
            engine.register(infoComponent);
            newNode = await infoComponent.createNode();
            newNode.position = pos;
            editor.addNode(newNode);
            break;

        case 'to_csv':
            let toCSVComponent = new ToCSVComponent(key);
            editor.register(toCSVComponent);
            engine.register(toCSVComponent);
            newNode = await toCSVComponent.createNode();
            newNode.position = pos;
            editor.addNode(newNode);
            break;


        default:
    }
}
