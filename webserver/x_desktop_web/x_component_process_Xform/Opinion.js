MWF.xDesktop.requireApp("process.Xform", "$Input", null, false);
MWF.xApplication.process.Xform.Opinion = MWF.APPOpinion =  new Class({
	Implements: [Events],
	Extends: MWF.APP$Input,
	
	_loadUserInterface: function(){

		this._loadNode();
        if (this.json.compute == "show"){
            this._setValue(this._computeValue());
        }else{
            this._loadValue();
        }
	},
    _loadNode: function(){
        if (this.readonly){
            this._loadNodeRead();
        }else{
            this._loadNodeEdit();
        }
    },
    _loadNodeRead: function(){
        this.node.empty();
        this.node.setStyle("display", "none");
    },
    _loadNodeEdit: function(){
		var input = new Element("textarea", {"styles": {
            "background": "transparent",
            "width": "100%",
            "border": "0px"
        }});
		input.set(this.json.properties);

        var node = new Element("div", {"styles": {"ovwrflow": "hidden", "position": "relative"}}).inject(this.node, "after");
        input.inject(node);
        this.node.destroy();
        this.node = node;
		//this.node = input;
		this.node.set({
			"id": this.json.id,
			"MWFType": this.json.type
		});
		this.input = input;
        this.node.addEvent("change", function(){
            this._setBusinessData(this.getInputData());
        }.bind(this));

        this.node.getFirst().addEvent("blur", function(){
            this.validation();
            this.hideSelectOpinionNode();
        }.bind(this));
        this.node.getFirst().addEvent("keyup", function(){
            this.validationMode();
        }.bind(this));

        this.node.getFirst().addEvent("keydown", function(e){
            if (this.selectOpinionNode && (this.selectOpinionNode.getStyle("display")!="none") && this.selectOpinionNode.getFirst()){
                if (e.code == 38){ //up
                    if (this.selectedOpinionNode){
                        var node = this.selectedOpinionNode.getPrevious();
                        if (!node) node = this.selectOpinionNode.getLast();
                        this.unselectedOpinion(this.selectedOpinionNode);
                        this.selectedOpinion(node)
                    }else{
                        node = this.selectOpinionNode.getLast();
                        this.selectedOpinion(node)
                    }
                }
                if (e.code == 40){ //down
                    debugger;
                    if (this.selectedOpinionNode){
                        var node = this.selectedOpinionNode.getNext();
                        if (!node) node = this.selectOpinionNode.getFirst();
                        this.unselectedOpinion(this.selectedOpinionNode);
                        this.selectedOpinion(node)
                    }else{
                        node = this.selectOpinionNode.getFirst();
                        this.selectedOpinion(node)
                    }
                }
                if (e.code == 27){  //esc
                    this.hideSelectOpinionNode();
                    e.preventDefault();
                }
                if (e.code == 32 || e.code == 13){  //space
                    if (this.selectedOpinionNode){
                        this.setOpinion(this.selectedOpinionNode.get("text"));
                        e.preventDefault();
                    }
                }
            }
        }.bind(this));


        MWF.UD.getDataJson("userOpinion", function(json){
            this.userOpinions = json;
        }.bind(this), false);
        this.node.getFirst().addEvent("input", function(e){
            this.startSearchOpinion();
        }.bind(this));
        this.node.getFirst().addEvent("focus", function(){
            this.startSearchOpinion();
        }.bind(this));

	},
    unselectedOpinion: function(node){
        node.setStyle("background-color", "#ffffff");
        this.selectedOpinionNode = null;
    },
    selectedOpinion: function(node){
        node.setStyle("background-color", "#d2ddf5");
        this.selectedOpinionNode = node;
    },
    startSearchOpinion: function(){
        var t = this.input.get("value");
        var arr = t.split(/(,\s*){1}|(;\s*){1}|\s+/g);
        t = arr[arr.length-1];
        if (t.length){
            this.clearSearcheOpinionId();
            this.searcheOpinionId = window.setTimeout(function(){
                this.searchOpinions(t);
            }.bind(this), 500);
        }else{
            this.clearSearcheOpinionId();
        }
    },
    clearSearcheOpinionId: function(){
        if (this.searcheOpinionId) {
            window.clearTimeout(this.searcheOpinionId);
            this.searcheOpinionId = "";
        }
    },
    searchOpinions: function(t){
        var value = this.input.get("value");
        var arr = value.split(/[\n\r]/g);
        lines = arr.length;
        value = arr[arr.length-1];
        var offsetValue = value;
        //var offsetValue = value.substr(0, value.length-t.length);

        var ops = this.userOpinions.filter(function(v, i){
            return v.contains(t) && (v!=t);
        }.bind(this));
        if (ops.length){
            this.showSelectOpinionNode(ops, offsetValue, lines);
        }else{
            this.hideSelectOpinionNode(ops);
        }
    },
    hideSelectOpinionNode: function(){
        if (this.selectOpinionNode) this.selectOpinionNode.setStyle("display", "none");
    },
    showSelectOpinionNode: function(ops, offsetValue, lines){
        if (!this.selectOpinionNode) this.createSelectOpinionNode();
        this.selectOpinionNode.empty();
        ops.each(function(op){
            this.createSelectOpinionOption(op);
        }.bind(this));

        var inputSize = this.input.getSize();
        var size = MWF.getTextSize(offsetValue, this.json.inputStyles);
        var offY = ((size.y-3)*lines)+3;
        if (offY>inputSize.y) offY = inputSize.y;

        this.selectOpinionNode.setStyle("display","block");
        this.selectOpinionNode.position({
            "relativeTo": this.node,
            "position": "leftTop",
            "edge": "leftTop",
            "offset": {"x": size.x, "y": offY}
        });
    },
    createSelectOpinionNode: function(){
        this.selectOpinionNode = new Element("div", {"styles": this.form.css.opinionSelectNode}).inject(this.node);
    },
    createSelectOpinionOption: function(op){
        var option = new Element("div", {"styles": this.form.css.opinionSelectOption, "text": op}).inject(this.selectOpinionNode);
        if (this.json.selectItemStyles) option.setStyles(this.json.selectItemStyles);
        option.addEvents({
            "mouseover": function(){this.setStyle("background-color", "#d2ddf5")},
            "mouseout": function(){this.setStyle("background-color", "#ffffff")},
            "mousedown": function(){this.setOpinion(op)}.bind(this)
        });
    },
    setOpinion: function(op){
        var v = this.input.get("value");
        var arr = v.split(/(,\s*){1}|(;\s*){1}|\s+/g);
        t = arr[arr.length-1];
        var leftStr = v.substr(0, v.length-t.length);
        this.input.set("value", leftStr+op);
        this.hideSelectOpinionNode();
    },

	_afterLoaded: function(){
        if (!this.readonly){
            this.loadDescription();
        }
	},
    loadDescription: function(){
        var v = this._getBusinessData();
        if (!v){
            if (this.json.description){
                var size = this.node.getFirst().getSize();
                var w = size.x-23;
                this.descriptionNode = new Element("div", {"styles": this.form.css.descriptionNode, "text": this.json.description}).inject(this.node);
                this.descriptionNode.setStyles({
                    "width": ""+w+"px",
                    "height": ""+size.y+"px",
                    "line-height": ""+size.y+"px"
                });
                this.setDescriptionEvent();
            }
        }
    },
    setDescriptionEvent: function(){
        if (this.descriptionNode){
            if (COMMON.Browser.Platform.name==="ios"){
                this.descriptionNode.addEvents({
                    "click": function(){
                        this.descriptionNode.setStyle("display", "none");
                        this.node.getFirst().focus();
                    }.bind(this)
                });
            }else if (COMMON.Browser.Platform.name==="android"){
                this.descriptionNode.addEvents({
                    "click": function(){
                        this.descriptionNode.setStyle("display", "none");
                        this.node.getFirst().focus();
                    }.bind(this)
                });
            }else{
                this.descriptionNode.addEvents({
                    "click": function(){
                        this.descriptionNode.setStyle("display", "none");
                        this.node.getFirst().focus();
                    }.bind(this)
                });
            }
            this.node.getFirst().addEvents({
                "focus": function(){
                    this.descriptionNode.setStyle("display", "none");
                }.bind(this),
                "blur": function(){
                    if (!this.node.getFirst().get("value")) this.descriptionNode.setStyle("display", "block");
                }.bind(this)
            });
        }
    }
	
}); 