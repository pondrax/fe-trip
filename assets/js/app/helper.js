var $=function(el){
	var $el=document.querySelectorAll(el);
	if($el.length==1){
		return $el[0];
	}
	return $el;
}
$.ready = function(fn){
	return document.addEventListener('DOMContentLoaded',fn)
}

var load = (urls)=>{
	if(!Array.isArray(urls)){
		urls = urls.split(',');
	}
	return urls.reduce( (previousPromise, url) => {
		return previousPromise.then(() => {
			return new Promise((resolve, reject) => {
				if(load.injected.includes(url)) {
					return setTimeout(()=>load.isLoaded(resolve),1000)
				};

				load.injected.push(url);
				if(url.indexOf('.js')>-1){
					var el = document.createElement('script');
					el.src = url;
					$('#app-script').appendChild(el);
				}
				if(url.indexOf('.css')>-1){
					var el = document.createElement('link');
					el.rel = 'stylesheet';
					el.type = 'text/css';
					el.href = url;
					$('head').appendChild(el);
				}
				el.onload = () => {
					load.loaded.push(el)
					resolve(el)
				};
				el.onerror = () => reject(el);
			});
		});
	}, Promise.resolve());
}
load = Object.assign(load,{
	injected : [],
	loaded : [],
	isLoaded : (resolve)=>{
		if(load.injected.length != load.loaded.length){
			setTimeout(()=>load.isLoaded(resolve),1000);
		}else{
			return resolve();
		}
	}
});

var http=function(url,props){
	if(!!window.APP_TOKEN){
		props={headers:{Authorization:'Bearer '+APP_TOKEN},...props};
	}
	return new Promise((resolve,reject)=>{
		fetch(url,props)
			.then(r=>{ 
				if(r.headers.has('jwt')){
					localStorage.setItem(config.$apikey, r.headers.get('jwt'));
				}
				if (r.ok) {
					return r.text()
				}else{
					return r.text().then(err => Promise.reject(err));
				}
			})
			.then(r=>{
				try{
					response	= JSON.parse(r);
				}catch(e){
					response	= r;
				}				
				if(response.success){
					return resolve(response)
				}else{
					return Promise.reject(response);
				}
			})
			.catch(e=>{
				try{
					error=JSON.parse(e)
				}catch(err){
					error=e
				}
				return reject(error)
			})
	})
}
http = Object.assign(http,{
	post 	: (url,props)=>http(url,Object.assign(props,{method:'post'})),
	put 	: (url,props)=>http(url,Object.assign(props,{method:'put'})),
	delete 	: (url,props)=>http(url,Object.assign(props,{method:'delete'}))
});

var groupBy = function(xs, key) {
	return xs.reduce(function(rv, x) {
		(rv[x[key]] = rv[x[key]] || []).push(x);
		return rv;
	}, {});
};

var setToValue=(obj, value, path)=> {
    var i;
    path = path.split('.');
    for (i = 0; i < path.length - 1; i++)
        obj = obj[path[i]];

    obj[path[i]] = value;
}
var uploadPath=(url)=>{
	if(!url){
		return null;
	}
	return (url.indexOf('/uploads')==0? BASEURL :'')+url;
}
function basename(str, sep) {
    return str.substr(str.lastIndexOf(sep) + 1);
}