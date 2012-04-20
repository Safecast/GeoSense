var OblessdClient = function(options) {
    var Socket = "MozWebSocket" in window ? MozWebSocket : WebSocket;
    var ws;

    var connect = function()
    {
        ws = new Socket("ws://18.85.58.17:8080/");
        var initialGlobeLoc; 
        var handTracker;

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
            if (options.track) {
                console.log('track');
                ws.send('track');
                handTracker = new HandTracker();
            };

        }

        ws.onmessage = function(evt) { 
            var protein = $.parseJSON(evt.data);
            var foundObjects = [];
            if (options.taggedObjects) {
                for (var o = 0; o < options.taggedObjects.length; o++) {
                    if (options.taggedObjects[o].update(protein)) {
                        foundObjects.push(options.taggedObjects[o].name);
                        options.vent.trigger('updateTaggedObject', options.taggedObjects[o]);
                    }
                }
            }

            $('#tracking-info').text(foundObjects.join(', '));
            if (options.track) {
                handTracker.update(protein);
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
    var p = protein.tags[this.tagName];
    if (p) {
        this.phys.loc = p.loc;
        this.phys.norm = p.norm;
        this.phys.over = p.over;

        var vLoc = new THREE.Vector3().add(new THREE.Vector3(p.loc[0], p.loc[1], p.loc[2]),
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

var HandTracker = function() {
    this.tracks = {};
    return this;
}

var HandTrack = function() {
    var self = this;
    this.frames = [];
    this.dragging = false;
    this.cursor = $('<div class="gest-cursor" />');
    this.pos = [0, 0, 0];
    this.stateChangePos = [0, 0, 0];
    this.clicked = false;

    this.posTween = new TWEEN.Tween(this.pos);
    this.posTween.easing(TWEEN.Easing.Quadratic.EaseOut);
    this.posTween.onUpdate(function() {
        self.cursor.offset({
            left: self.pos[0] - self.cursor.width() / 2,
            top: self.pos[1] - self.cursor.height() / 2
        });
    });

    $('body').append(this.cursor);
    return this;
}

HandTracker.prototype.update = function(protein) {
    // Tracks configuration

    var GRIPE_OPEN_HAND = '\\/\\/-';
    var GRIPE_FIST = '^^^^>';
    var GRIPE_PUSHBACK = '||||-';
    var GRIPE_HEAD = '_____';

    var TRACK_W = 640;
    var TRACK_H = 480;
    var TRACK_SAMPLE_SIZE = 5;
    var IGNORE_MOVEMENT = 5; 
    var TWEEN_DURATION = 100;

    var PUSH_DISTANCE = 10;
    var VIGNETTE_FACTOR = 1.2;

    var tracksInFrame = protein['tracks'];
    if (!tracksInFrame) return;

    for (var key in tracksInFrame) {
        var fingers = tracksInFrame[key].gripe.split(':')[0];
        if (fingers == GRIPE_HEAD) break;

        if (!this.tracks[key]) {
            console.log('cursor appeared');
            this.tracks[key] = new HandTrack();
        } else if (this.tracks[key].frames.length == TRACK_SAMPLE_SIZE) {
            this.tracks[key].frames.shift();
        }

        var pos = tracksInFrame[key].pos;
        var windowW = $(window).width();
        var windowH = $(window).height();
        pos[0] = Math.round((pos[0] / TRACK_W) * VIGNETTE_FACTOR * windowW + windowW / 2);
        pos[1] = Math.round((-TRACK_H / 2 + pos[1]) / -TRACK_H * VIGNETTE_FACTOR * windowH + windowH / 2);

        var frame = {
            pos: pos,
            fingers: fingers,
        };

        var t = this.tracks[key];
        t.frames.push(frame);
        if (t.frames.length > 1) {
            var last = frame;
            var nextToLast = t.frames[t.frames.length - 2];
            // State changed:
            if (last.fingers != nextToLast.fingers) {
                t.stateChangePos = [pos[0], pos[1], pos[2]];
                if (last.fingers == GRIPE_PUSHBACK) {
                    console.log('enter push/zoom mode');
                } else {
                    t.clicked = false;
                }
                if (nextToLast.fingers == GRIPE_PUSHBACK) {
                    console.log('leave push/zoom mode');
                }  
                if (last.fingers == GRIPE_FIST) {
                    var el = document.elementFromPoint(t.stateChangePos[0], t.stateChangePos[1]);
                    if ($(el).hasClass('ui-draggable')) {
                        console.log('start drag');
                        t.dragging = true;
                        t.cursor.addClass('active');
                        var center = $(el).simulate('findCenter');
                        var coord = { clientX: center.x, clientY: center.y };
                        $(el).simulate('simulateEvent', "mousedown", coord);
                    }
                    
                }  
                if (nextToLast.fingers == GRIPE_FIST) {
                    console.log('stop drag');
                    t.dragging = false;
                    t.cursor.removeClass('active');
                }  
            } else {
                if (last.fingers == GRIPE_FIST && t.dragging) {
                    var el = document.elementFromPoint(t.stateChangePos[0], t.stateChangePos[1]);
                    var coord = { clientX: pos[0], clientY: pos[1] };
                    $(el).simulate('simulateEvent', "mousemove", coord);
                }
                if (last.fingers == GRIPE_PUSHBACK) {
                    if (!t.clicked && t.pos[2] - t.stateChangePos[2] < -PUSH_DISTANCE) {
                        var el = document.elementFromPoint(t.stateChangePos[0], t.stateChangePos[1]);
                        $(el).trigger('click');
                        t.clicked = true;
                        console.log('clicked '+el);
                    }
                }
            }
        }
    }

    var tracksInBuffer = {};
    for (var key in this.tracks) {
        tracksInBuffer[key] = true;  
    }
    for (var key in tracksInBuffer) {
        if (!tracksInFrame[key]) {
            console.log('cursor disappeared');
            this.tracks[key].cursor.remove();
            if (this.tracks[key].dragging) {
                console.log('cancel drag');
            }
            delete this.tracks[key];
        }
    }

    for (var key in this.tracks) {
        var f;
        var t = this.tracks[key];
        var pos = [0, 0, 0];
        var l = t.frames.length;
        // get running average of pos in frames
        for (var i = 0; i < l; i++) {
            f = t.frames[i];
            pos[0] += f.pos[0];
            pos[1] += f.pos[1];
            pos[2] += f.pos[2];
        }
        // get average pos
        pos[0] /= l;
        pos[1] /= l;
        pos[2] /= l;

        var deltaX = t.pos[0] - pos[0];
        var deltaY = t.pos[1] - pos[1];
        if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) > IGNORE_MOVEMENT) {
            t.posTween.stop();
            t.posTween.to(pos, TWEEN_DURATION);
            t.posTween.start();
        }
    }
};
