
var silolib = ['global','loader','cache','router','view'];
(function(includes){
    for(var a=0, i; i=includes[a]; a++){
        var h = document.querySelector('head');
        var path = document.querySelector("script[src$=silo\\.js]").getAttribute('src').replace(/silo\.js$/, i + '.js');
        s = document.createElement('script');
        s.addEventListener('load', function(){
            var src = this.getAttribute('src').match(/([a-z0-9_\-]+)\.js$/)[1];
            silolib.splice(silolib.indexOf(src),1);
            if(!silolib.length){  Silo.ready(); }
        })
        s.setAttribute('type', 'text/javascript'),
            s.setAttribute('src', path);
        h.appendChild(s);
    }
})(silolib);

var Silo = new function(){
    this.listeners = [];

    this.ready = function(callback){
        if(callback === undefined){
            (function(that){
                for(var a= 0, cb; cb=that.listeners[a]; a++){
                    cb();
                }
            })(this);
        }else if(typeof(callback) === 'function'){
            this.listeners.push(callback);
        }
    };

    this.scope = function(n){
        return getFrom(this.scope, n);
    };

    /**
     * @desc
     * 1. Load Silos
     * 2. Load and instantiate Controllers
     * 3. Load views and includes
     */
    this.init = function(){
        var silos = $dom('[silo]');
        for(var a= 0, silo; silo=silos[a]; a++){
            var path = silo.attr('src') || './';
            if(!silo.attr('silo')){
                silo.remove();
                continue;
            }
            this.initLoadControllers(silo);
        }
        (function(){
            for(var a= 0, func; func=this.listeners[a]; a++){
                func();
            }
        });
    };

    this.loadController = function(ctrl, path){
        if (!(src = ctrl.attr('src'))) {
            ctrl.remove();
            return;
        }
        ctrl.path = path;
        var url = path + '/' + src.replace('.','/') + '.js';
        Silo.Loader.load({
            url: url,
            target: {dom:ctrl, path:path},
            load: function(e){
                var dom = this.target.dom;
                var controller = eval('new ' + this.responseText);
                controller.dom = ctrl;
                controller.path = this.target.path;
                if(is_function(controller.construct)){controller.construct(); }
                setTo(Silo.scope, dom.attr('src'), controller);
                Silo.loadViews(ctrl);
            }
        })
    };

    this.loadViews = function(ctrl){
        (function(ctrl){
            if(!(views = ctrl.find('silo\\:view, silo\\:include'))){ return false;}
            for(var a= 0, view; view=views[a]; a++){
                if(view.element.nodeName.match(/silo:view/i)){
                    var src = ctrl.path + '/views/' + view.attr('src');
                }else{
                    var src = view.attr('src');
                }
                Silo.Loader.load({
                    url: src,
                    target: {view:view},
                    load: function(r){
                        if(this.statusText !== 'OK'){
                           return this.target.view.remove();
                        }

                        this.target.view.replaceWith(this.responseText)
                       // console.log('load successful');
                       // console.log(this.target.view.attr('src'));
                    }
                })
            }

        })(ctrl);
    }

    this.initLoadControllers = function(silo){
        (function(silo){
            var path = silo.attr('src') || '.';
            if((controllers = silo.find('silo\\:controller'))) {
                for (var a = 0, ctrl; ctrl = controllers[a]; a++) {
                    Silo.loadController(ctrl, path);
                }

            }
        })(silo);
    }
    window.addEventListener('load', function(){
        Silo.init();
    });
}();
