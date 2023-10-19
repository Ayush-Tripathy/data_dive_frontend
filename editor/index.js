var numSocket = new Rete.Socket("Number");
var strSocket = new Rete.Socket("String");


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

function openDisplayModal(event) {
    let nodeId = event.target.closest(".node").id.split("-")[1];
    var node = editor.nodes.find(n => n.id == nodeId);

    document.getElementById("display-modal").style.display = "block";
    document.getElementById("display-modal-content").innerHTML = node.data.table;
    document.getElementById("display-modal-close").addEventListener("click", closeDisplayModal);
}

function closeDisplayModal() {
    document.getElementById("display-modal-content").innerHTML = "";
    document.getElementById("display-modal").style.display = "none";
}

var components = [
    new FileComponent(100),
    new DisplayComponent(101),
    new SelectColumnComponent(102),
    new SelectRowsComponent(103)];

var container = document.getElementById("rete");
var editor = new Rete.NodeEditor("ddive@0.1.0", container);
editor.use(VueRenderPlugin.default);
editor.use(ConnectionPlugin.default);
editor.use(ContextMenuPlugin.default);
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
    var display = await components[1].createNode();
    var select = await components[2].createNode();
    var select_rows = await components[3].createNode();

    file.position = [500, 400];
    display.position = [500, 600];
    select.position = [500, 800];
    select_rows.position = [500, 1000];

    editor.addNode(file);
    editor.addNode(display);
    editor.addNode(select);
    editor.addNode(select_rows);

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
    console.log(name, pos_x, pos_y);

    let transform = editor.view.area.transform;

    // Calculate the node position in the editor coordinate system
    pos_x = (pos_x - transform.x) / transform.k;
    pos_y = (pos_y - transform.y) / transform.k;
    let pos = [pos_x, pos_y];

    let key = editor.nodes.length;
    switch (name) {
        case 'display':
            var addComponent = new DisplayComponent(key);
            editor.register(addComponent);
            engine.register(addComponent);
            var add = await addComponent.createNode();
            add.position = pos;
            editor.addNode(add);
            break;
        case 'file':
            var fileComponent = new FileComponent(key);
            editor.register(fileComponent);
            engine.register(fileComponent);
            var add = await fileComponent.createNode();
            add.position = pos;
            editor.addNode(add);
            break;
        case 'select_col':
            var selectColumnComponent = new SelectColumnComponent(key);
            editor.register(selectColumnComponent);
            engine.register(selectColumnComponent);
            var add = await selectColumnComponent.createNode();
            add.position = pos;
            editor.addNode(add);
            break;
        case 'select_rows':
            var selectRowsComponent = new SelectRowsComponent(key);
            editor.register(selectRowsComponent);
            engine.register(selectRowsComponent);
            var add = await selectRowsComponent.createNode();
            add.position = pos;
            editor.addNode(add);
            break;

        default:
    }
}
