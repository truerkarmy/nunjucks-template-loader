const fs = require('fs');
const path = require('path');
const utils = require('loader-utils');
const nunjucks = require('nunjucks');

const NunjucksLoader = nunjucks.Loader.extend({
    init: function(searchPaths, sourceFoundCallback) {
    	this.sourceFoundCallback = sourceFoundCallback;
        if(searchPaths) {
            searchPaths = Array.isArray(searchPaths) ? searchPaths : [searchPaths];

            this.searchPaths = searchPaths.map(path.normalize);
        }
        else {
            this.searchPaths = ['.'];
        }
    },

    getSource: function(name) {
    	let fullpath = null;
        let paths = this.searchPaths;

        for(let i=0; i<paths.length; i++) {
            let basePath = path.resolve(paths[i]);
            let p = path.resolve(paths[i], name);

            if(p.indexOf(basePath) === 0 && fs.existsSync(p)) {
                fullpath = p;
                break;
            }
        }

        if(!fullpath) {
            return null;
        }

        this.sourceFoundCallback(fullpath);

        return {
			src: fs.readFileSync(fullpath, 'utf-8'),
			path: fullpath,
			noCache: this.noCache
		};
    }
});

module.exports = function(content) {
	this.cacheable();

	const callback = this.async();
	const opt = utils.getOptions(this.query);

	const nunjucksSearchPaths = opt.searchPaths;
	const nunjucksContext = opt.context;

	const loader = new NunjucksLoader(nunjucksSearchPaths, function(path) {
		this.addDependency(path);
	}.bind(this));

	const nunjEnv = new nunjucks.Environment(loader);
	nunjucks.configure(null, { watch: false });

	const template = nunjucks.compile(content, nunjEnv);
	const html = template.render(nunjucksContext);

	callback(null, html);
};