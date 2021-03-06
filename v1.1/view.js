Silo.View = function(param){
    return new (function(param){
        this.url = (is_string(param)) ? param :  param.url || false;
        this.load = param.load || false;
        this.error =  param.error || false;
        this.html = false;

        this.target = function(v){
            if(v === undefined){return this.target.dom;}
            if(!is_object(v)) return false;
            var dom = getFrom(v,'element');
            if(!is_element(getFrom(v, 'element'))) return false;
            this.target.dom = v;
        };

        this.target.dom = (is_element(getFrom(param,'target.element'))) ? param.target : false;

        this.render = function(variables) {
            Silo.Loader.load({
                url: (window.location.search.match(/debug/)) ? this.url + '?' + Date.now() : this.url,
                target: {view:this,variables:variables},
                load: function(){
                    if(this.statusText === "OK"){
                        var el = this.target.view.target();
                        if(el){
                            el.html(this.responseText)
                        }
                    }else{

                    }
                }
            })
        }
    })(param);
}

/**
 * @desc will render placeholders {{varName}} and return rendered value
 * 	it can work like this too {{varName || methodName() || "alt string value if all else fails"}}
 * 	if will try each segment until one returns true or false if non returns true
 *  notice methods can be denoted with triling ().
 *  String value must be enclosed in single or double quote
 */
Silo.View.placeholderValue = function(placeholder, vars, scope){
    var value = (function(placeholder, vars, scope){
        var expression = placeholder.replace(/^{{/,'').replace(/}}$/,'');
        var match = expression.match(/^([\w.]+)(\(\))?/);
        var subject = match[1]
        var isFunction = match[2];
        var value = null;
        if(isFunction){
            var func = getFrom(vars, subject);
            value = (is_function(func)) ? func() : null;
        }else{
            value = getFrom(vars, subject);
        }

        if(value) return value;

        var pattern = /\|\|\s([\w\s.'"!@#$%^&*\[\]()_+]+)/g;
        while((match = pattern.exec(expression))){
            var subject = match[1].trim();
            if(subject.match(/\(\)$/)){
                var func = getFrom(vars,subject.replace('()',''));
                value = (is_function(func)) ? func() : null;
            }else if((m = match[1].trim().match(/^'|"/))){
                value = subject.replace(/^'|"/,'').replace(/'|"$/,'');
            }else{
                value = getFrom(vars, subject);
            }
            if(value) return value;
        }
        return value;
        //var exp = placeholder.replace('{{','').replace('}}','');
        //return exp;
    })(placeholder, vars, scope);
    return value;
};

Silo.View.renderEach = function(tag, html, vars){
    return (function(tag,html,vars){
        var subject = tag.open.seg(0).key;
        var collection = getFrom(vars, subject);

        if(!is_array(collection) && !is_object(collection)){
            console.log("Silo Error: Invalid each source in " + subject);
            return this.htmlDeleteTag(tag, html);
        }

        var alias = tag.open.seg(2).key;
        var key = tag.open.attr('key');
        var tags = this.matchTags(html);
        var content = html.substring(tag.open.index + tag.open.html.length, tag.close.index);
        var markup = (function(collection, alias, vars, html, tags, view){
            var markup = '';

            vars.iteration = 0;
            for(key in collection){
                var _markup = html;
                vars[alias||'item'] = collection[key]
                var pattern = /{{([\w\s;:.,'"!|@#$%^&*()_+\-\[\]]+)}}/g;
                if((match = _markup.match(pattern))){
                    for(var a=0, placeholder; placeholder=match[a]; a++){
                        _markup = _markup.replace(placeholder, view.placeholderValue(placeholder, vars));
                    }
                }
                markup+=_markup;
                vars.iteration++;
            }
            return markup
        })(collection, alias, vars, content, tags, this);
        html = html.substring(0, tag.open.index) + markup + html.substring(tag.close.index + tag.close.html.length);
        return html;

    })(tag,html,vars);

};

Silo.View.replacePlaceholders = function(html, vars){
    var pattern = /{{([\w\s;:.,'"!|@#$%^&*()_+\-\[\]]+)}}/g;
    if((match = html.match(pattern))){
        for(var a=0, placeholder; placeholder=match[a]; a++){
            var value = this.placeholderValue(placeholder, vars);
            value = (value) ? value : '';
            html = html.replace(placeholder, value);
        }
    }
    return html;
}
