var OblessdClient = function(options) {
    var Socket = "MozWebSocket" in window ? MozWebSocket : WebSocket;
    var ws;

    var connect = function()
    {
        ws = new Socket("ws://18.85.58.17:8080/");
        var initialGlobeLoc; 

        ws.onopen = function(evt) {
            if (options.taggedObjects) {
                for (var o = 0; o < options.taggedObjects.length; o++) {
                    var tags = options.taggedObjects[o].tags;
                    for (var i = 0; i < tags.length; i++) {
                        ws.send('watch '+tags[i].tagName);
                        console.log('watch '+tags[i].tagName);
                    }
                }
            }

        }

        ws.onmessage = function(evt) { 
            var protein = $.parseJSON(evt.data);
            if (options.taggedObjects) {
                for (var o = 0; o < options.taggedObjects.length; o++) {
                    if (options.taggedObjects[o].update(protein)) {
                        options.vent.trigger('updateTaggedObject', options.taggedObjects[o]);
                    }
                }
            }
        };

        ws.onclose = function(evt) {
            // try to reconnect after an interval
            setTimeout(connect, 2000);
        }

        ws.onerror = function(evt) {
        }
    }

    connect();
};

var TaggedObject = function(name, tags) {
    this.name = name;
    this.tags = tags;
    this.loc = null;
    this.norm = null;
    this.over = null;

    return this;
};

TaggedObject.prototype.update = function(protein) {
    var tags = this.tags;
    var avgLoc = new THREE.Vector3();
    var avgNorm = new THREE.Vector3();
    var avgOver = new THREE.Vector3();
    var updated = 0;
    for (var i = 0; i < tags.length; i++) {
        var t = tags[i];
        if (t.update(protein)) {
            avgLoc.addSelf(t.virt.loc);
            avgNorm.addSelf(t.virt.norm);
            avgOver.addSelf(t.virt.over);
            updated++;
        }
    }
    if (updated >= tags.length / 2) {
        this.loc = avgLoc.divideScalar(updated);
        this.norm = avgNorm.divideScalar(updated);
        this.over = avgOver.divideScalar(updated);
        return true;
    }
    return false;
};

var ObjectTag = function(tagName, relLoc, relRot) {
    this.tagName = tagName;
    this.rel = {
        loc: new THREE.Vector3(relLoc[0], relLoc[1], relLoc[2]),
        mult: []
    };
    if (relRot) {
        if (relRot[0] != 0) {
            this.rel.mult.push(new THREE.Matrix4().setRotationX(relRot[0]));
        }
        if (relRot[1] != 0) {
            this.rel.mult.push(new THREE.Matrix4().setRotationY(relRot[1]));
        }
        if (relRot[2] != 0) {
            this.rel.mult.push(new THREE.Matrix4().setRotationZ(relRot[2]));
        }
    }
    this.phys = {
        loc: null,
        norm: null,
        over: null
    };
    this.virt = {
        loc: null,
        norm: null,
        over: null
    };

    return this;
};

ObjectTag.prototype.update = function(protein) {
    var p = protein[this.tagName];
    if (p) {
        this.phys.loc = p.loc;
        this.phys.norm = p.norm;
        this.phys.over = p.over;

        var vLoc = new THREE.Vector3().sub(new THREE.Vector3(p.loc[0], p.loc[1], p.loc[2]),
            this.rel.loc);
        var vNorm = new THREE.Vector3(p.norm[0], p.norm[1], p.norm[2]);
        var vOver = new THREE.Vector3(p.over[0], p.over[1], p.over[2]);



        // todo: add rel loc with correct orientation

        // todo: make this work 
        /*
        if (this.rel.mult.length) {
            for (var i = 0; i < this.rel.mult.length; i++) {
                vLoc = this.rel.mult[i].multiplyVector3(vLoc);
                vNorm = this.rel.mult[i].multiplyVector3(vNorm);
                vOver = this.rel.mult[i].multiplyVector3(vOver);
            }
        }
        */

        this.virt.loc = vLoc.multiplyScalar(VIRTUAL_PHYSICAL_FACTOR);
        this.virt.norm = vNorm;
        this.virt.over = vOver;        

        this.virt.norm = vNorm.multiplyScalar(VIRTUAL_PHYSICAL_FACTOR);
        this.virt.x = Math.round(this.virt.x);
        this.virt.y = Math.round(this.virt.y);
        this.virt.z = Math.round(this.virt.z);

        //this.virt.over = vOver.multiplyScalar(VIRTUAL_PHYSICAL_FACTOR);

        return true;
    }
    return false;
};
