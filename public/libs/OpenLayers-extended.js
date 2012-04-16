OpenLayers.Renderer.Canvas.drawImageScaleFactor = null;

OpenLayers.Renderer.Canvas2 = OpenLayers.Class(OpenLayers.Renderer, {
    hitDetection: !0,
    hitOverflow: 0,
    canvas: null,
    canvasComposite: "source-over",
    features: null,
    pendingRedraw: !1,
    initialize: function () {
        OpenLayers.Renderer.prototype.initialize.apply(this, arguments);
        this.root = document.createElement("canvas");
        typeof FlashCanvas != "undefined" && FlashCanvas.initElement(this.root);
        this.container.appendChild(this.root);
        this.canvas = this.root.getContext("2d");
        this.features = {};
        if (this.hitDetection) this.hitCanvas = document.createElement("canvas"), typeof FlashCanvas != "undefined" && FlashCanvas.initElement(this.hitCanvas), this.hitContext = this.hitCanvas.getContext("2d")
    },
    eraseGeometry: function (a, b) {
        this.eraseFeatures(this.features[b][0])
    },
    supported: function () {
        return !0
    },
    setSize: function (a) {
        this.size = a.clone();
        var b = this.root;
        b.style.width = a.w + "px";
        b.style.height = a.h + "px";
        b.width = a.w;
        b.height = a.h;
        this.resolution = null;
        if (this.hitDetection) b = this.hitCanvas, b.style.width = a.w + "px", b.style.height = a.h + "px", b.width = a.w, b.height = a.h
    },
    drawFeature: function (a, b) {
        var c;
        if (a.geometry) b = this.applyDefaultSymbolizer(b || a.style), c = a.geometry.getBounds(), (c = !! c && c.intersectsBounds(this.extent)) ? this.features[a.id] = [a, b] : delete this.features[a.id], this.pendingRedraw = !0;
        if (this.pendingRedraw && !this.locked) this.redraw(), this.pendingRedraw = !1;
        return c
    },
    drawGeometry: function (a, b, c) {
        var d = a.CLASS_NAME;
        if (d == "OpenLayers.Geometry.Collection" || d == "OpenLayers.Geometry.MultiPoint" || d == "OpenLayers.Geometry.MultiLineString" || d == "OpenLayers.Geometry.MultiPolygon") for (d = 0; d < a.components.length; d++) this.drawGeometry(a.components[d], b, c);
        else switch (a.CLASS_NAME) {
        case "OpenLayers.Geometry.Point":
            this.drawPoint(a, b, c);
            break;
        case "OpenLayers.Geometry.LineString":
            this.drawLineString(a, b, c);
            break;
        case "OpenLayers.Geometry.LinearRing":
            this.drawLinearRing(a, b, c);
            break;
        case "OpenLayers.Geometry.Polygon":
            this.drawPolygon(a, b, c)
        }
    },
    drawExternalGraphic: function (a, b, c) {
        var d = new Image;
        if (b.graphicTitle) d.title = b.graphicTitle;
        var e = b.graphicWidth || b.graphicHeight,
            f = b.graphicHeight || b.graphicWidth,
            e = e ? e : b.pointRadius * 2,
            f = f ? f : b.pointRadius * 2,
            g = b.graphicXOffset != void 0 ? b.graphicXOffset : -(0.5 * e),
            h = b.graphicYOffset != void 0 ? b.graphicYOffset : -(0.5 * f),
            j = b.graphicOpacity || b.fillOpacity;
        d.onload = OpenLayers.Function.bind(function () {
            if (this.features[c]) {
                var b = this.getLocalXY(a),
                    k = b[0],
                    b = b[1];
                if (!isNaN(k) && !isNaN(b)) {
                    var k = k + g | 0,
                        b = b + h | 0,
                        l = this.canvas;
                    l.globalAlpha = j;
                    var m = OpenLayers.Renderer.Canvas.drawImageScaleFactor || (OpenLayers.Renderer.Canvas.drawImageScaleFactor = /android 2.1/.test(navigator.userAgent.toLowerCase()) ? 320 / window.screen.width : 1);
                    l.drawImage(d, k * m, b * m, e * m, f * m);
                    this.hitDetection && (this.setHitContextStyle("fill", c), this.hitContext.fillRect(k, b, e, f))
                }
            }
        }, this);
        d.src = b.externalGraphic
    },
    setCanvasStyle: function (a, b) {
        a === "fill" ? (this.canvas.globalAlpha = b.fillOpacity, this.canvas.fillStyle = b.fillColor) : a === "stroke" ? (this.canvas.globalAlpha = b.strokeOpacity, this.canvas.strokeStyle = b.strokeColor, this.canvas.lineWidth = b.strokeWidth) : (this.canvas.globalAlpha = 0, this.canvas.lineWidth = 1)
    },
    featureIdToHex: function (a) {
        a = Number(a.split("_").pop()) + 1;
        if (a >= 16777216) this.hitOverflow = a - 16777215, a = a % 16777216 + 1;
        var a = "000000" + a.toString(16),
            b = a.length;
        return a = "#" + a.substring(b - 6, b)
    },
    setHitContextStyle: function (a, b, c) {
        b = this.featureIdToHex(b);
        a == "fill" ? (this.hitContext.globalAlpha = 1, this.hitContext.fillStyle = b) : a == "stroke" ? (this.hitContext.globalAlpha = 1, this.hitContext.strokeStyle = b, this.hitContext.lineWidth = c.strokeWidth + 2) : (this.hitContext.globalAlpha = 0, this.hitContext.lineWidth = 1)
    },
    drawPoint: function (a, b, c) {
        if (b.graphic !== !1) if (b.externalGraphic) this.drawExternalGraphic(a, b, c);
        else {
            var d = this.getLocalXY(a),
                a = d[0],
                d = d[1];
            if (!isNaN(a) && !isNaN(d)) {
                var e = Math.PI * 2,
                    f = b.pointRadius;
                b.fill !== !1 && (this.setCanvasStyle("fill", b), this.canvas.fillRect(a, d, 2, 2), this.hitDetection && (this.setHitContextStyle("fill", c, b), this.hitContext.beginPath(), this.hitContext.arc(a, d, f, 0, e, !0), this.hitContext.fill()));
                b.stroke !== !1 && (this.setCanvasStyle("stroke", b), this.canvas.beginPath(), this.canvas.arc(a, d, f, 0, e, !0), this.canvas.stroke(), this.hitDetection && (this.setHitContextStyle("stroke", c, b), this.hitContext.beginPath(), this.hitContext.arc(a, d, f, 0, e, !0), this.hitContext.stroke()), this.setCanvasStyle("reset"))
            }
        }
    },
    drawLineString: function (a, b, c) {
        b = OpenLayers.Util.applyDefaults({
            fill: !1
        }, b);
        this.drawLinearRing(a, b, c)
    },
    drawLinearRing: function (a, b, c) {
        b.fill !== !1 && (this.setCanvasStyle("fill", b), this.renderPath(this.canvas, a, b, c, "fill"), this.hitDetection && (this.setHitContextStyle("fill", c, b), this.renderPath(this.hitContext, a, b, c, "fill")));
        b.stroke !== !1 && (this.setCanvasStyle("stroke", b), this.renderPath(this.canvas, a, b, c, "stroke"), this.hitDetection && (this.setHitContextStyle("stroke", c, b), this.renderPath(this.hitContext, a, b, c, "stroke")));
        this.setCanvasStyle("reset")
    },
    renderPath: function (a, b, c, d, e) {
        b = b.components;
        c = b.length;
        a.beginPath();
        var d = this.getLocalXY(b[0]),
            f = d[1];
        if (!isNaN(d[0]) && !isNaN(f)) {
            a.moveTo(d[0], d[1]);
            for (d = 1; d < c; ++d) f = this.getLocalXY(b[d]), a.lineTo(f[0], f[1]);
            e === "fill" ? a.fill() : a.stroke()
        }
    },
    drawPolygon: function (a, b, c) {
        var a = a.components,
            d = a.length;
        this.drawLinearRing(a[0], b, c);
        for (var e = 1; e < d; ++e) {
            this.canvas.globalCompositeOperation = "destination-out";
            if (this.hitDetection) this.hitContext.globalCompositeOperation = "destination-out";
            this.drawLinearRing(a[e], OpenLayers.Util.applyDefaults({
                stroke: !1,
                fillOpacity: 1
            }, b), c);
            this.canvas.globalCompositeOperation = "source-over";
            if (this.hitDetection) this.hitContext.globalCompositeOperation = "source-over";
            this.drawLinearRing(a[e], OpenLayers.Util.applyDefaults({
                fill: !1
            }, b), c)
        }
    },
    drawText: function (a, b) {
        var b = OpenLayers.Util.extend({
            fontColor: "#000000",
            labelAlign: "cm"
        }, b),
            c = this.getLocalXY(a);
        this.setCanvasStyle("reset");
        this.canvas.fillStyle = b.fontColor;
        this.canvas.globalAlpha = b.fontOpacity || 1;
        var d = [b.fontStyle ? b.fontStyle : "normal", "normal", b.fontWeight ? b.fontWeight : "normal", b.fontSize ? b.fontSize : "1em", b.fontFamily ? b.fontFamily : "sans-serif"].join(" "),
            e = b.label.split("\n"),
            f = e.length;
        if (this.canvas.fillText) {
            this.canvas.font = d;
            this.canvas.textAlign = OpenLayers.Renderer.Canvas.LABEL_ALIGN[b.labelAlign[0]] || "center";
            this.canvas.textBaseline = OpenLayers.Renderer.Canvas.LABEL_ALIGN[b.labelAlign[1]] || "middle";
            var g = OpenLayers.Renderer.Canvas.LABEL_FACTOR[b.labelAlign[1]];
            g == null && (g = -0.5);
            d = this.canvas.measureText("Mg").height || this.canvas.measureText("xx").width;
            c[1] += d * g * (f - 1);
            for (g = 0; g < f; g++) this.canvas.fillText(e[g], c[0], c[1] + d * g)
        } else if (this.canvas.mozDrawText) {
            this.canvas.mozTextStyle = d;
            var h = OpenLayers.Renderer.Canvas.LABEL_FACTOR[b.labelAlign[0]];
            h == null && (h = -0.5);
            g = OpenLayers.Renderer.Canvas.LABEL_FACTOR[b.labelAlign[1]];
            g == null && (g = -0.5);
            d = this.canvas.mozMeasureText("xx");
            c[1] += d * (1 + g * f);
            for (g = 0; g < f; g++) {
                var j = c[0] + h * this.canvas.mozMeasureText(e[g]),
                    i = c[1] + g * d;
                this.canvas.translate(j, i);
                this.canvas.mozDrawText(e[g]);
                this.canvas.translate(-j, -i)
            }
        }
        this.setCanvasStyle("reset")
    },
    getLocalXY: function (a) {
        var b = this.getResolution(),
            c = this.extent;
        return [a.x / b + -c.left / b, c.top / b - a.y / b]
    },
    clear: function () {
        var a = this.root.height,
            b = this.root.width;
        this.canvas.clearRect(0, 0, b, a);
        this.features = {};
        this.hitDetection && this.hitContext.clearRect(0, 0, b, a)
    },
    getFeatureIdFromEvent: function (a) {
        var b = null;
        if (this.hitDetection && !this.map.dragging) a = a.xy, a = this.hitContext.getImageData(a.x | 0, a.y | 0, 1, 1).data, a[3] === 255 && (a = a[2] + 256 * (a[1] + 256 * a[0])) && (b = this.features["OpenLayers.Feature.Vector_" + (a - 1 + this.hitOverflow)][0]);
        return b
    },
    eraseFeatures: function (a) {
        OpenLayers.Util.isArray(a) || (a = [a]);
        for (var b = 0; b < a.length; ++b) delete this.features[a[b].id];
        this.redraw()
    },
    drawComposite: function (a) {
        if (a && a.attributes) {
            a = a.attributes.colour;
            this.canvas.globalCompositeOperation = this.canvasComposite;
            for (var b = 1; b < 20; b++) this.canvas.fillStyle = a, this.canvas.fillRect(100, 100, 10 * b, 10)
        }
    },
    ptRedraw: function (a) {
        if (!this.locked) {
            var b = this.root.height,
                c = this.root.width;
            this.canvas.clearRect(0, 0, c, b);
            this.hitDetection && this.hitContext.clearRect(0, 0, c, b);
            var b = [],
                d, e = this.getResolution(),
                f = this.extent;
            (new Date).getTime();
            var g = this.map.zoom > 5 ? 2 : 1;
            this.canvas.globalCompositeOperation = this.canvasComposite;
            for (var h = this.canvasComposite == "lighter", j = [], i = a.length, c = 0; c < i; c++) {
                d = a[c];
                var k = d.geometry,
                    l = k.getBounds();
                if (l && l.intersectsBounds(this.extent) && (l = k.x / e + -f.left / e, k = f.top / e - k.y / e, !isNaN(l) && !isNaN(k))) {
                    var l = parseInt(l),
                        k = parseInt(k),
                        m = l.toString() + "_" + k.toString(),
                        n = j[m] ? !0 : !1;
                    if (c < 1E5 && h || n == !1) if (j[m] = 1, d = d.attributes.colour, d != "") this.canvas.fillStyle = d, this.canvas.fillRect(l, k, g, g)
                }
            }(new Date).getTime();
            c = 0;
            for (e = b.length; c < e; ++c) a = b[c], this.drawText(a[0].geometry.getCentroid(), a[1])
        }
    },
    redraw: function () {
        this.ptRedraw()
    },
    CLASS_NAME: "OpenLayers.Renderer.Canvas2"
});

OpenLayers.Layer.VectorPt = OpenLayers.Class(OpenLayers.Layer, {
    EVENT_TYPES: ["beforefeatureadded", "beforefeaturesadded", "featureadded", "featuresadded", "beforefeatureremoved", "beforefeaturesremoved", "featureremoved", "featuresremoved", "beforefeatureselected", "featureselected", "featureunselected", "beforefeaturemodified", "featuremodified", "afterfeaturemodified", "vertexmodified", "vertexremoved", "sketchstarted", "sketchmodified", "sketchcomplete", "refresh"],
    isBaseLayer: !1,
    isFixed: !1,
    features: null,
    filter: null,
    selectedFeatures: null,
    unrenderedFeatures: null,
    reportError: !0,
    style: null,
    styleMap: null,
    strategies: null,
    protocol: null,
    renderers: ["SVG", "VML", "Canvas"],
    renderer: null,
    rendererOptions: null,
    geometryType: null,
    drawn: !1,
    initialize: function () {
        this.EVENT_TYPES = OpenLayers.Layer.Vector.prototype.EVENT_TYPES.concat(OpenLayers.Layer.prototype.EVENT_TYPES);
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);
        (!this.renderer || !this.renderer.supported()) && this.assignRenderer();
        if (!this.renderer || !this.renderer.supported()) this.renderer = null, this.displayError();
        if (!this.styleMap) this.styleMap = new OpenLayers.StyleMap;
        this.features = [];
        this.selectedFeatures = [];
        this.unrenderedFeatures = {};
        if (this.strategies) for (var a = 0, b = this.strategies.length; a < b; a++) this.strategies[a].setLayer(this)
    },
    destroy: function () {
        if (this.strategies) {
            var a, b, c;
            b = 0;
            for (c = this.strategies.length; b < c; b++) a = this.strategies[b], a.autoDestroy && a.destroy();
            this.strategies = null
        }
        if (this.protocol) this.protocol.autoDestroy && this.protocol.destroy(), this.protocol = null;
        this.destroyFeatures();
        this.unrenderedFeatures = this.selectedFeatures = this.features = null;
        this.renderer && this.renderer.destroy();
        this.drawn = this.geometryType = this.renderer = null;
        OpenLayers.Layer.prototype.destroy.apply(this, arguments)
    },
    clone: function (a) {
        a == null && (a = new OpenLayers.Layer.Vector(this.name, this.getOptions()));
        for (var a = OpenLayers.Layer.prototype.clone.apply(this, [a]), b = this.features, c = b.length, d = Array(c), e = 0; e < c; ++e) d[e] = b[e].clone();
        a.features = d;
        return a
    },
    refresh: function (a) {
        this.calculateInRange() && this.visibility && this.events.triggerEvent("refresh", a)
    },
    assignRenderer: function () {
        for (var a = 0, b = this.renderers.length; a < b; a++) {
            var c = this.renderers[a];
            if ((c = typeof c == "function" ? c : OpenLayers.Renderer[c]) && c.prototype.supported()) {
                this.renderer = new c(this.div, this.rendererOptions);
                break
            }
        }
    },
    displayError: function () {
        this.reportError && OpenLayers.Console.userError(OpenLayers.i18n("browserNotSupported", {
            renderers: this.renderers.join("\n")
        }))
    },
    setMap: function () {
        OpenLayers.Layer.prototype.setMap.apply(this, arguments);
        this.renderer ? (this.renderer.map = this.map, this.renderer.setSize(this.map.getSize())) : this.map.removeLayer(this)
    },
    afterAdd: function () {
        if (this.strategies) {
            var a, b, c;
            b = 0;
            for (c = this.strategies.length; b < c; b++) a = this.strategies[b], a.autoActivate && a.activate()
        }
    },
    removeMap: function () {
        this.drawn = !1;
        if (this.strategies) {
            var a, b, c;
            b = 0;
            for (c = this.strategies.length; b < c; b++) a = this.strategies[b], a.autoActivate && a.deactivate()
        }
    },
    onMapResize: function () {
        OpenLayers.Layer.prototype.onMapResize.apply(this, arguments);
        this.renderer.setSize(this.map.getSize())
    },
    moveTo: function (a, b, c) {
        OpenLayers.Layer.prototype.moveTo.apply(this, arguments);
        var d = OpenLayers.Renderer.NG && this.renderer instanceof OpenLayers.Renderer.NG;
        if (d) c || this.renderer.updateDimensions(b);
        else {
            var e = !0;
            if (!c) {
                this.renderer.root.style.visibility = "hidden";
                this.div.style.left = -parseInt(this.map.layerContainerDiv.style.left) + "px";
                this.div.style.top = -parseInt(this.map.layerContainerDiv.style.top) + "px";
                e = this.renderer.setExtent(this.map.getExtent(), b);
                this.renderer.root.style.visibility = "visible";
                if (OpenLayers.IS_GECKO === !0) this.div.scrollLeft = this.div.scrollLeft;
                if (!b && e) for (var f in this.unrenderedFeatures) this.drawFeature(this.unrenderedFeatures[f])
            }
        }
        if (!this.drawn || !d && (b || !e)) this.drawn = !0, this.renderer.ptRedraw(this.features)
    },
    redraw: function () {
        if (OpenLayers.Renderer.NG && this.renderer instanceof OpenLayers.Renderer.NG) this.drawn = !1;
        return OpenLayers.Layer.prototype.redraw.apply(this, arguments)
    },
    display: function () {
        OpenLayers.Layer.prototype.display.apply(this, arguments);
        var a = this.div.style.display;
        if (a != this.renderer.root.style.display) this.renderer.root.style.display = a
    },
    addFeatures: function (a, b) {
        OpenLayers.Util.isArray(a) || (a = [a]);
        var c = !b || !b.silent;
        if (c) {
            var d = {
                features: a
            };
            if (this.events.triggerEvent("beforefeaturesadded", d) === !1) return;
            a = d.features
        }
        for (var d = [], e = 0, f = a.length; e < f; e++) {
            this.renderer.locked = e != a.length - 1 ? !0 : !1;
            var g = a[e];
            if (this.geometryType && !(g.geometry instanceof this.geometryType)) throw OpenLayers.i18n("componentShouldBe", {
                geomType: this.geometryType.prototype.CLASS_NAME
            });
            g.layer = this;
            if (!g.style && this.style) g.style = OpenLayers.Util.extend({}, this.style);
            if (c) {
                if (this.events.triggerEvent("beforefeatureadded", {
                    feature: g
                }) === !1) continue;
                this.preFeatureInsert(g)
            }
            d.push(g);
            this.features.push(g);
            this.drawFeature(g);
            c && (this.events.triggerEvent("featureadded", {
                feature: g
            }), this.onFeatureInsert(g))
        }
        c && this.events.triggerEvent("featuresadded", {
            features: d
        })
    },
    removeFeatures: function (a, b) {
        if (a && a.length !== 0) {
            if (a === this.features) return this.removeAllFeatures(b);
            OpenLayers.Util.isArray(a) || (a = [a]);
            a === this.selectedFeatures && (a = a.slice());
            var c = !b || !b.silent;
            c && this.events.triggerEvent("beforefeaturesremoved", {
                features: a
            });
            for (var d = a.length - 1; d >= 0; d--) {
                this.renderer.locked = d != 0 && a[d - 1].geometry ? !0 : !1;
                var e = a[d];
                delete this.unrenderedFeatures[e.id];
                c && this.events.triggerEvent("beforefeatureremoved", {
                    feature: e
                });
                this.features = OpenLayers.Util.removeItem(this.features, e);
                e.layer = null;
                e.geometry && this.renderer.eraseFeatures(e);
                OpenLayers.Util.indexOf(this.selectedFeatures, e) != -1 && OpenLayers.Util.removeItem(this.selectedFeatures, e);
                c && this.events.triggerEvent("featureremoved", {
                    feature: e
                })
            }
            c && this.events.triggerEvent("featuresremoved", {
                features: a
            })
        }
    },
    removeAllFeatures: function (a) {
        var a = !a || !a.silent,
            b = this.features;
        a && this.events.triggerEvent("beforefeaturesremoved", {
            features: b
        });
        for (var c, d = b.length - 1; d >= 0; d--) c = b[d], a && this.events.triggerEvent("beforefeatureremoved", {
            feature: c
        }), c.layer = null, a && this.events.triggerEvent("featureremoved", {
            feature: c
        });
        this.renderer.clear();
        this.features = [];
        this.unrenderedFeatures = {};
        this.selectedFeatures = [];
        a && this.events.triggerEvent("featuresremoved", {
            features: b
        })
    },
    destroyFeatures: function (a, b) {
        if (a == void 0) a = this.features;
        if (a) {
            this.removeFeatures(a, b);
            for (var c = a.length - 1; c >= 0; c--) a[c].destroy()
        }
    },
    drawFeature: function (a, b) {
        if (this.drawn) {
            if (typeof b != "object") {
                !b && a.state === OpenLayers.State.DELETE && (b = "delete");
                var c = b || a.renderIntent;
                (b = a.style || this.style) || (b = this.styleMap.createSymbolizer(a, c))
            }
            c = this.renderer.drawFeature(a, b);
            c === !1 || c === null ? this.unrenderedFeatures[a.id] = a : delete this.unrenderedFeatures[a.id]
        }
    },
    eraseFeatures: function (a) {
        this.renderer.eraseFeatures(a)
    },
    getFeatureFromEvent: function (a) {
        if (!this.renderer) return OpenLayers.Console.error(OpenLayers.i18n("getFeatureError")), null;
        var b = null;
        (a = this.renderer.getFeatureIdFromEvent(a)) && (b = typeof a === "string" ? this.getFeatureById(a) : a);
        return b
    },
    getFeatureBy: function (a, b) {
        for (var c = null, d = 0, e = this.features.length; d < e; ++d) if (this.features[d][a] == b) {
            c = this.features[d];
            break
        }
        return c
    },
    getFeatureById: function (a) {
        return this.getFeatureBy("id", a)
    },
    getFeatureByFid: function (a) {
        return this.getFeatureBy("fid", a)
    },
    getFeaturesByAttribute: function (a, b) {
        var c, d, e = this.features.length,
            f = [];
        for (c = 0; c < e; c++)(d = this.features[c]) && d.attributes && d.attributes[a] === b && f.push(d);
        return f
    },
    onFeatureInsert: function () {},
    preFeatureInsert: function () {},
    getDataExtent: function () {
        var a = null,
            b = this.features;
        if (b && b.length > 0) for (var c = null, d = 0, e = b.length; d < e; d++) if (c = b[d].geometry) a === null && (a = new OpenLayers.Bounds), a.extend(c.getBounds());
        return a
    },
    CLASS_NAME: "OpenLayers.Layer.VectorPt"
});

Geom = OpenLayers.Geometry;


Geom.Rectangle = function () {
    this._height = this._width = this._bottom = this._right = this._top = this._left = 0;
    this._isEmpty = !0
};
Geom.Rectangle.prototype.resize = function () {
    this._width = this._right - this._left;
    this._height = this._bottom - this._top
};
Geom.Rectangle.prototype.getX = function () {
    return this._left
};
Geom.Rectangle.prototype.getY = function () {
    return this._top
};
Geom.Rectangle.prototype.getWidth = function () {
    return this._width
};
Geom.Rectangle.prototype.getHeight = function () {
    return this._height
};
Geom.Rectangle.prototype.getLeft = function () {
    return this._left
};
Geom.Rectangle.prototype.getTop = function () {
    return this._top
};
Geom.Rectangle.prototype.getRight = function () {
    return this._right
};
Geom.Rectangle.prototype.getBottom = function () {
    return this._bottom
};
Geom.Rectangle.prototype.set = function (a, b, c, d) {
    this._isEmpty = !1;
    this._left = a;
    this._top = b;
    this._right = c;
    this._bottom = d;
    this.resize()
};
Geom.Rectangle.prototype.setX = function (a) {
    this._left = a;
    this.resize()
};
Geom.Rectangle.prototype.setY = function (a) {
    this._top = a;
    this.resize()
};
Geom.Rectangle.prototype.setLeft = function (a) {
    this._left = a;
    this.resize()
};
Geom.Rectangle.prototype.setRight = function (a) {
    this._right = a;
    this.resize()
};
Geom.Rectangle.prototype.setTop = function (a) {
    this._top = a;
    this.resize()
};
Geom.Rectangle.prototype.setBottom = function (a) {
    this._bottom = a;
    this.resize()
};
Geom.Rectangle.prototype.addPoint = function (a, b) {
    this._isEmpty ? (this._isEmpty = !1, this._left = a, this._top = b, this._right = a, this._bottom = b) : (this._left = this._left < a ? this._left : a, this._top = this._top < b ? this._top : b, this._right = this._right > a ? this._right : a, this._bottom = this._bottom > b ? this._bottom : b);
    this.resize()
};
Geom.Rectangle.prototype.add3Points = function (a, b, c, d, e, f) {
    this._isEmpty ? (this._isEmpty = !1, this._left = a < c ? a < e ? a : e : c < e ? c : e, this._top = b < d ? b < f ? b : f : d < f ? d : f, this._right = a > c ? a > e ? a : e : c > e ? c : e, this._bottom = b > d ? b > f ? b : f : d > f ? d : f) : (this._left = a < c ? a < e ? a < this._left ? a : this._left : e < this._left ? e : this._left : c < e ? c < this._left ? c : this._left : e < this._left ? e : this._left, this._top = b < d ? b < f ? b < this._top ? b : this._top : f < this._top ? f : this._top : d < f ? d < this._top ? d : this._top : f < this._top ? f : this._top, this._right = a > c ? a > e ? a > this._right ? a : this._right : e > this._right ? e : this._right : c > e ? c > this._right ? c : this._right : e > this._right ? e : this._right, this._bottom = b > d ? b > f ? b > this._bottom ? b : this._bottom : f > this._bottom ? f : this._bottom : d > f ? d > this._bottom ? d : this._bottom : f > this._bottom ? f : this._bottom);
    this.resize()
};
Geom.Rectangle.prototype.addRectangle = function (a) {
    this._isEmpty ? (this._isEmpty = !1, this._left = a.getLeft(), this._top = a.getTop(), this._right = a.getRight(), this._bottom = a.getBottom()) : (this._left = this._left < a.getLeft() ? this._left : a.getLeft(), this._top = this._top < a.getTop() ? this._top : a.getTop(), this._right = this._right > a.getRight() ? this._right : a.getRight(), this._bottom = this._bottom > a.getBottom() ? this._bottom : a.getBottom());
    this.resize()
};
Geom.Rectangle.prototype.inflate = function (a) {
    this._left -= a;
    this._top -= a;
    this._right += a;
    this._bottom += a;
    this.resize()
};
Geom.Rectangle.prototype.minSelf = function (a) {
    this._left = this._left > a.getLeft() ? this._left : a.getLeft();
    this._top = this._top > a.getTop() ? this._top : a.getTop();
    this._right = this._right < a.getRight() ? this._right : a.getRight();
    this._bottom = this._bottom < a.getBottom() ? this._bottom : a.getBottom();
    this.resize()
};
Geom.Rectangle.prototype.intersects = function (a) {
    return Math.min(this._right, a.getRight()) - Math.max(this._left, a.getLeft()) >= 0 && Math.min(this._bottom, a.getBottom()) - Math.max(this._top, a.getTop()) >= 0
};
Geom.Rectangle.prototype.empty = function () {
    this._isEmpty = !0;
    this._bottom = this._right = this._top = this._left = 0;
    this.resize()
};
Geom.Rectangle.prototype.isEmpty = function () {
    return this._isEmpty
};
Geom.Vector2 = function (a, b) {
    this.x = a || 0;
    this.y = b || 0
};
Geom.Vector2.prototype = {
    constructor: Geom.Vector2,
    set: function (a, b) {
        this.x = a;
        this.y = b;
        return this
    },
    copy: function (a) {
        this.x = a.x;
        this.y = a.y;
        return this
    },
    clone: function () {
        return new Geom.Vector2(this.x, this.y)
    },
    add: function (a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        return this
    },
    addSelf: function (a) {
        this.x += a.x;
        this.y += a.y;
        return this
    },
    sub: function (a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        return this
    },
    subSelf: function (a) {
        this.x -= a.x;
        this.y -= a.y;
        return this
    },
    multiplyScalar: function (a) {
        this.x *= a;
        this.y *= a;
        return this
    },
    divideScalar: function (a) {
        a ? (this.x /= a, this.y /= a) : this.set(0, 0);
        return this
    },
    negate: function () {
        return this.multiplyScalar(-1)
    },
    dot: function (a) {
        return this.x * a.x + this.y * a.y
    },
    lengthSq: function () {
        return this.x * this.x + this.y * this.y
    },
    length: function () {
        return Math.sqrt(this.lengthSq())
    },
    normalize: function () {
        return this.divideScalar(this.length())
    },
    distanceTo: function (a) {
        return Math.sqrt(this.distanceToSquared(a))
    },
    distanceToSquared: function (a) {
        var b = this.x - a.x,
            a = this.y - a.y;
        return b * b + a * a
    },
    setLength: function (a) {
        return this.normalize().multiplyScalar(a)
    },
    equals: function (a) {
        return a.x === this.x && a.y === this.y
    }
};
Geom.Vector3 = function (a, b, c) {
    this.x = a || 0;
    this.y = b || 0;
    this.z = c || 0
};
Geom.Vector3.prototype = {
    constructor: Geom.Vector3,
    set: function (a, b, c) {
        this.x = a;
        this.y = b;
        this.z = c;
        return this
    },
    setX: function (a) {
        this.x = a;
        return this
    },
    setY: function (a) {
        this.y = a;
        return this
    },
    setZ: function (a) {
        this.z = a;
        return this
    },
    copy: function (a) {
        this.x = a.x;
        this.y = a.y;
        this.z = a.z;
        return this
    },
    clone: function () {
        return new Geom.Vector3(this.x, this.y, this.z)
    },
    add: function (a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        return this
    },
    addSelf: function (a) {
        this.x += a.x;
        this.y += a.y;
        this.z += a.z;
        return this
    },
    addScalar: function (a) {
        this.x += a;
        this.y += a;
        this.z += a;
        return this
    },
    sub: function (a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        return this
    },
    subSelf: function (a) {
        this.x -= a.x;
        this.y -= a.y;
        this.z -= a.z;
        return this
    },
    multiply: function (a, b) {
        this.x = a.x * b.x;
        this.y = a.y * b.y;
        this.z = a.z * b.z;
        return this
    },
    multiplySelf: function (a) {
        this.x *= a.x;
        this.y *= a.y;
        this.z *= a.z;
        return this
    },
    multiplyScalar: function (a) {
        this.x *= a;
        this.y *= a;
        this.z *= a;
        return this
    },
    divideSelf: function (a) {
        this.x /= a.x;
        this.y /= a.y;
        this.z /= a.z;
        return this
    },
    divideScalar: function (a) {
        a ? (this.x /= a, this.y /= a, this.z /= a) : this.z = this.y = this.x = 0;
        return this
    },
    negate: function () {
        return this.multiplyScalar(-1)
    },
    dot: function (a) {
        return this.x * a.x + this.y * a.y + this.z * a.z
    },
    lengthSq: function () {
        return this.x * this.x + this.y * this.y + this.z * this.z
    },
    length: function () {
        return Math.sqrt(this.lengthSq())
    },
    lengthManhattan: function () {
        return this.x + this.y + this.z
    },
    normalize: function () {
        return this.divideScalar(this.length())
    },
    setLength: function (a) {
        return this.normalize().multiplyScalar(a)
    },
    cross: function (a, b) {
        this.x = a.y * b.z - a.z * b.y;
        this.y = a.z * b.x - a.x * b.z;
        this.z = a.x * b.y - a.y * b.x;
        return this
    },
    crossSelf: function (a) {
        var b = this.x,
            c = this.y,
            d = this.z;
        this.x = c * a.z - d * a.y;
        this.y = d * a.x - b * a.z;
        this.z = b * a.y - c * a.x;
        return this
    },
    distanceTo: function (a) {
        return Math.sqrt(this.distanceToSquared(a))
    },
    distanceToSquared: function (a) {
        return (new Geom.Vector3).sub(this, a).lengthSq()
    },
    setPositionFromMatrix: function (a) {
        this.x = a.n14;
        this.y = a.n24;
        this.z = a.n34
    },
    setRotationFromMatrix: function (a) {
        var b = Math.cos(this.y);
        this.y = Math.asin(a.n13);
        Math.abs(b) > 1.0E-5 ? (this.x = Math.atan2(-a.n23 / b, a.n33 / b), this.z = Math.atan2(-a.n12 / b, a.n11 / b)) : (this.x = 0, this.z = Math.atan2(a.n21, a.n22))
    },
    isZero: function () {
        return this.lengthSq() < 1.0E-4
    }
};
