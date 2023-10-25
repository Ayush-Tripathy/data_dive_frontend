var CustomNode = {
    template: `<div class="node" v-bind:id="unid" :class="[selected(), node.name] | kebab">
      <div class="container">
          <div class="title">{{node.name}}</div>
          <div class="row">
            <!-- Controls-->
                <div class="controls">
                <div class="control" v-for="control in controls()" v-control="control"></div>
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
            return this.node.id;
        }
    }
}

var CustomFileControl = {
    props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
    template: '<input type="file" @input="change($event)" @dblclick.stop="" @pointerdown.stop="" @pointermove.stop=""/>',
    data() {
        return {
            value: 0,
        }
    },
    methods: {
        change(e) {
            this.value = e.target.files[0];
            this.update();
        },
        update() {
            if (this.ikey)
                this.putData(this.ikey, this.value)
            this.emitter.trigger('process');
        }
    },
    mounted() {
        this.value = this.getData(this.ikey);
    }
}



class FileControl extends Rete.Control {
    constructor(emitter, key, readonly) {
        super(key);
        this.component = CustomFileControl;
        this.props = { emitter, ikey: key, readonly };
    }

    setValue(val) {
        this.vueContext.value = val;
    }
}

const CheckboxControl = {
    props: ['emitter', 'ikey', 'label', 'readonly'],
    template: `<div>
        <input v-bind:id="unid" class="check-input" type="checkbox" v-model="value" @change="updateValue" :disabled="readonly">
        <label onclick="handleClickInputControlLabel(event)">{{label}}</label>
    </div>`,
    data() {
        return {
            value: false,
        };
    },
    computed: {
        level() {
            // Compute the level based on the checkbox state (true or false)
            return this.value ? 'High' : 'Low';
        },
        unid() {
            return this.ikey;
        }
    },
    methods: {
        updateValue() {
            // Update the value and emit the control change event
            this.emitter.trigger('process', 'output', { [this.ikey]: this.value });
        }
    },
};

function handleClickInputControlLabel(event) {
    console.log("handleClickInputControlLabel");
    console.log(event.target.closest(".check-input"));
}

class SelectColumnControl extends Rete.Control {
    constructor(emitter, key, label, readonly) {
        super(key);
        this.component = CheckboxControl;
        this.props = { emitter, ikey: key, label: label, readonly };
    }

    setValue(val) {
        this.vueContext.value = val;
    }

    getValue() {
        return this.vueContext.value;
    }
}

const ConditionControl = {
    props: ['emitter', 'ikey', 'select1Options', 'select2Options', 'textInputValue'],
    template: `
        <div v-bind:id="unid">
            <select v-model="select1Value" @change="updateInputValues">
                <option v-for="option in select1Options" :value="option.value">{{ option.label }}</option>
            </select>
            <select v-model="select2Value" @change="updateInputValues">
                <option v-for="option in filteredSelect2Options" :value="option.value">{{ option.label }}</option>
            </select>
            <input type="text" v-model="textInputValue" @input="updateInputValues">
        </div>
    `,
    data() {
        return {
            select1Value: '',
            select2Value: '',
            textInputValue: ''
        };
    },
    computed: {
        filteredSelect2Options() {
            return this.select2Options.filter(option => option.select1Value === this.select1Value);
        },
        unid() {
            return `condition-control-${this.ikey}`;
        }
    },
    // watch: {
    //     select1Value() {
    //         this.emitter.trigger('process', 'output', { select1Value: this.select1Value, select2Value: this.select2Value, textInputValue: this.textInputValue });
    //     },
    //     select2Value() {
    //         this.emitter.trigger('process', 'output', { select1Value: this.select1Value, select2Value: this.select2Value, textInputValue: this.textInputValue });
    //     },
    //     textInputValue() {
    //         this.emitter.trigger('process', 'output', { select1Value: this.select1Value, select2Value: this.select2Value, textInputValue: this.textInputValue });
    //     }
    // },

    methods: {
        updateInputValues() {
            // Emit an event when the values change
            if (this.select1Value !== '' && this.select2Value !== '' && this.textInputValue !== undefined) {
                this.emitter.trigger('process', {
                    [this.ikey]: {
                        select1Value: this.select1Value,
                        select2Value: this.select2Value,
                        textInputValue: this.textInputValue
                    }
                });
            }
        }
    }
};


class SelectRowControl extends Rete.Control {
    constructor(emitter, key, options) {
        super(key);
        this.component = ConditionControl;
        this.props = { emitter, ikey: key, ...options };
    }

    setValue(val) {
        this.vueContext.value = val;
    }

    getValue() {
        return this.vueContext.value;
    }
}