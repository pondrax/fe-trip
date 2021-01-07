app.mixin({
	emits:['update:data'],
	methods:{
		$logout(){
			logout();
		},
		$asset(url){
			return this.$baseurl+'assets/'+url;
		},
		$upload(url, defaultUrl){
			if(!url){
				if(!defaultUrl){
					return this.$baseurl+'assets/img/logo.png';
				}
				return null;
			}
			return (url.indexOf('/uploads')==0? this.$baseurl :'') + url;
		},
		reset() {
			console.log('[Mixin Reset]');
			// Reset to default data
			Object.assign(this.$data, this.$options.data.call(this));					
			this.$emit('update:data',Object.assign(this.data,{
				show:!this.data.show,
				form:{}
			}));
		},
		exception(e){
			console.log('[Mixin Exception]', e);
			// this.$emit('update:data', Object.assign(this.data, e.data));
			this.error = {err:e.error};
		},
		open(node,data){
			console.log('[Mixin Open]');
			// console.log(data);
			if(typeof data =='undefined'){
				data = {};
			}
			if(data.hasOwnProperty('timestamp')){
				delete data.timestamp;
			}
			if(data.hasOwnProperty('no')){
				delete data.no;
			}
			this[node] = {
				form : Object.assign({}, data), 
				show : 1
			};
		},
		setData(form){	
			var formData = new FormData();
			Object.keys(form).map(name=>{
				var value = form[name];
				if(typeof value !=='undefined' && value !='undefined'){
					formData.append(name,value)
				}
			})
			return formData;
		},
		updateData({url,method,data,success,fail}){
			APP.$refs.LOADER.start();
			if(method=='delete'){
				url = url+'/'+ (!data.id ? 
					Object.keys(data).map(d=>data[d]) :
					data.id);
				body = {};
			}else{
				body = this.setData(data);
				method	= !data.id? 'post' : 'put'				
			}
			http(url, {
				body : body,
				method :method
			}).then(response=>{
				if(!!success){
					success(response);
				}else{
                    APP.$refs.LOADER.add(response.message, 'success', -1);
                    APP.$refs.LOADER.clear(3000);
                    this.reset();
                }
			}).catch(error=>{
				if(fail){
					fail(error);
				}
                APP.$refs.LOADER.add(`
                    <b>${error.message}</b>
                    <pre class="transparent">${JSON.stringify(error.error, null, 2)}</pre>
                `, 'error', -1);
                // this.exception(error);
			}).finally(_=>{
				APP.$refs.LOADER.stop();
				if(!!APP.$refs.TABLE){
					APP.$refs.TABLE.refresh();
				}
			});
		},
		removeAction(data){	
			var html = data.cloneNode(true);
			html.querySelectorAll(`th:first-child, td:first-child`)
				.forEach(e => e.parentNode.removeChild(e));
			var id = [...html.querySelectorAll('th')].findIndex(th=>{
				return th.innerText.indexOf('actions')>-1
			});
			// console.log(html,id);
			if(id>-1){
				html.querySelectorAll(`th:nth-child(${id+1}), td:nth-child(${id+1})`)
					.forEach(e => e.parentNode.removeChild(e));
			}
			return html;			
		},
		$download(filename,url){
			var downloadLink = document.createElement("a");
			document.body.appendChild(downloadLink);
			downloadLink.href = url;
			downloadLink.download = filename;
			downloadLink.click();
			document.body.removeChild(downloadLink);
		},
		$export(type,data,config){
			config = Object.assign({
				title		: this.$page,
				caption		: this.$page,
				author		: 'drax',
				orientation	: 'portrait',
				size		: [210, 297],
				margin		: [30, 30, 30, 30]
			},config);
			
			if(config.orientation == 'landscape' && config.size[0]<config.size[1]){
				config.size = config.size.reverse();
			}
			
			switch(type){
				case 'PDF':
					var html=this.removeAction(data);					
					load([
						this.$asset('js/lib/pdf/jspdf.umd.min.js'),
						this.$asset('js/lib/pdf/jspdf.plugin.autotable.min.js')
					]).then(r=>{
						if (!window.jsPDF) window.jsPDF = window.jspdf.jsPDF;						
						var doc = new jsPDF({
							orientation	: config.orientation,
							unit		: "mm",
							format		: config.size
						});
						doc.setProperties(config);
						doc.text(config.caption, 15, 20);
						doc.autoTable({ 
							margin: { top: 25 },
							html: html 
						})
						doc.output('dataurlnewwindow');
					});
					// load([
						// this.$asset('js/lib/pdf/pdfmake.min.js'),
						// this.$asset('js/lib/pdf/pdfmake.vfs_fonts.min.js'),
						// this.$asset('js/lib/pdf/pdfmake.html.min.js'),
					// ]).then(r=>{
						// var val = htmlToPdfmake(html.outerHTML);
						// var dd = {content:val};
						// pdfMake.createPdf(dd).download();
					// });
				break;
				
				case 'XLS':
					var html = `
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html xmlns:office="urn:schemas-microsoft-com:office:office" xmlns:excel="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
	<head>
		<meta charset='utf-8'>
		<title>${config.title}</title>
		<style>
			@page Excel{
				mso-page-orientation:${config.orientation};
				size:${config.size.map(s=>s+'mm').join(' ')} ;
				margin:${config.margin.map(m=>m+'mm').join(' ')} ;
			}
			div.Excel{
				page:Excel;
			}
			table, table th, table td{
				border-collapse: collapse;
				border: 1px solid black;
			}
		</style>
	</head>
	<body>
		<div class="Excel">
			<h3>${config.caption}</h3>
			${this.removeAction(data).outerHTML}
		</div>
	</body>
</html>`;
					this.$download(
						config.title+'.xls',
						'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(html)
					);
				break;
				
				case 'DOC':
					var html = `
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html xmlns:office="urn:schemas-microsoft-com:office:office" xmlns:word="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
	<head>
		<meta charset='utf-8'>
		<title>${config.title}</title>
		<style>
			@page Word{
				mso-page-orientation:${config.orientation};
				size:${config.size.map(s=>s+'mm').join(' ')} ;
				margin:${config.margin.map(m=>m+'mm').join(' ')} ;
			}
			div.Word{
				page:Word;
			}
			table, table th, table td{
				border-collapse: collapse;
				border: 1px solid black;
			}
		</style>
	</head>
	<body>
		<div class="Word">
			<h3>${config.caption}</h3>
			${this.removeAction(data).outerHTML}
		</div>
	</body>
</html>`;
					this.$download(
						config.title+'.doc',
						'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html)
					);
				break;
				
				case 'CSV':
					var replacer = (key, value) => value === null ? '' : value;
					var header = Object.keys(data[0])
					let csv = data.map(row => {
						return header.map(col => JSON.stringify(row[col], replacer)).join(',');
					})
					csv.unshift(header.join(';'));
					csv = csv.join('\r\n');
					this.$download(
						config.title+'.csv',
						'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
					);
				break;
				
				default:
					var json = JSON.stringify(data, null, 2);
					this.$download(
						config.title+'.json',
						'data:application/json;charset=utf-8,' + encodeURIComponent(json)
					);
				break;
			}
		}
	}
});


app.component('app-loader',{
	name:'AppLoader',
	template: `
		<div>
			<div v-if="progress" class="fixed top-left top-right" style="z-index:1050">
				<div class="meter">
					<span :style="{width: progress+'%'}"></span>
				</div>			
			</div>
			<div v-if="messages.length>0" class="fixed top-right p-5" style="z-index:1050">
				<div v-for="(m,i) in messages" :key="i">
					<div :class="'p-2 toast '+m.style" style="width:300px;max-width:300px;max-height:200px;overflow:auto">
						<a class="right text-white" @click="remove(i)" style="height:0;margin-top:-3px">&times;</a>
						<div class="small" v-html="m.text"></div>
					</div>
				</div>
			</div>
		</div>
	`,
	data(){
		return {
			loader:-1,
			progress:0,
			messages:[
				// {style:'success',text:'trial message'},
				// {style:'info',text:'trial message'},
				// {style:'warning',text:'trial message'},
				// {style:'error',text:'trial message'},
			]
		}
	},
	methods:{
		start(){
			if(this.progress>0) return;
			this.add('Loading... ','info',-1);
			this.loader= this.messages.length -1;
			var loading = setInterval(()=>{
				this.progress++;						
				if(this.progress>90){
					clearInterval(loading);
				}
			},10);
			return this;
		},
		stop(){
			this.progress = 100;
			setTimeout(()=>{
				this.progress=0;
				this.remove(this.loader);
				this.loader=-1;
			},200);
			return this;
		},
		add(text,style,time){
			this.messages.push({text,style});
			if(time != -1){
				setTimeout(()=>this.messages.pop(),time);
			}
			return this;
		},
		remove(index){
			this.messages.splice(index,1);
			return this;
		},
		clear(time){
			time = time || 3000;
			setTimeout(()=>this.messages=[], time);
			return this;
		}
	}
});


app.component('app-navbar',{
	name:'AppNavbar',
	props:['loading'],
	template: `	
		<div>
			<div class="fixed top-left top-right px-4 white shadow border-bottom">
				<div class="row">
					<div class="p-0 large">
						<a @click="show=!show" class="button px-1 py-0 transparent text-black">
							<i class="feather-menu"></i>
						</a>
						<a :href="$baseurl" class="button p-0 white text-black">
							<img :src="$baseurl+'assets/img/logo.png'" style="height:30px">
							{{ $name }}
						</a>
					</div>
					<div class="py-1 text-right">						
						<div class="group dropdown dropdown-right"> 
							<button class="my-0 mr-1 py-0 px-1 transparent text-black " style="line-height:1.75" data-dropdown tabindex="0">
								<i class="feather-user"></i> &nbsp;Hi,&nbsp;
								<b>{{ $logged.username }}</b>
							</button>
							<ul class="menu text-center"> 
								<li class="menu-item px-4">
									<img :src="$logged.photo" class="avatar">
									<small>{{$logged.role}}</small>
								</li> 
								<li class="menu-item">
									<a href="lit/app/profil"><i class="feather-user"></i> Profil</a>
								</li> 
								<li class="menu-item">
									<a @click="$logout()"><i class="feather-log-out"></i> Logout</a>
								</li> 
							</ul> 
						</div>
					</div>
				</div>
			</div>
			<div v-show="show&&navbar">
				<div class="fixed top-left top-right overflow-y px-2 text-white navy" style="max-height:300px;margin-top:40px">
					<div class="p-1" style="background:#ffffff11;border-bottom:#111"></div>
					<div class="row pt-2">
						<div v-for="(m,key) in $menu" :key="key">
							<div class="py-1 px-4">
								<i :class="m[0].icon+' mr-2'"></i>
								<span class="border-bottom-left" v-text="key"></span>
							</div>
							<ul class="m-0 p-0" style="list-style:none">
								<li v-for="r in m" class="px-4 m-0">
									<i class="feather-arrow-right mr-2"></i>
									<a :href="$baseurl + r.route" class="text-white text-capitalize" v-text="r.route.split(/[\\/]/).pop()"></a>
								</li>
							</ul>
						</div>
					</div>
					<div class="p-1" style="background:#ffffff11;border-bottom:#111"></div>
				</div>
			</div>
			<div v-show="show&&sidebar">
				<div class="fixed top-left bottom-right" style="background:#333333cc" @click="show=0"></div>
				<div class="fixed top-left bottom-left overflow-y text-white navy" style="width:250px">
					<h5 class="px-3" style="background:#ffffff11;border-bottom:#111">
						<img :src="$baseurl+'assets/img/logo.png'" style="height:40px;margin-bottom:-10px">
						{{ $name }}
					</h5>
					<div class="row one py-5 mt-5">
						<div v-for="(m,key) in $menu" :key="key">
							<div class="py-1 px-4">
								<i :class="m[0].icon+' mr-2'"></i>
								<span class="border-bottom-left" v-text="key"></span>
							</div>
							<ul class="m-0 p-0" style="list-style:none">
								<li v-for="r in m" class="px-4 py-1 m-0" style="background:#11111111">
									<i class="feather-arrow-right mr-2"></i>
									<a :href="$baseurl + r.route" class="text-white text-capitalize" v-text="r.route.split(/[\\/]/).pop()"></a>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
			<div class="p-3"></div>
		</div>
	`,
	props:['navbar','sidebar'],
	data(){
		return {
			show:0,
		}
	},
});


app.component('google-auth',{
	name:'GoogleAuth',
	template: `	
        <button @click="signIn" type="button">{{text}}</button>
	`,
    props:['scope','success','text'],
	data(){
		return {
            GoogleAuth:null,
            user:null
		}
	},
    mounted(){
		load(['https://apis.google.com/js/api.js']).then(r=>{   
            gapi.load('client:auth2', this.initClient);
        });
    },
    methods:{
        initClient() {
            var self = this;
            gapi.client.init({
                'apiKey': 'AIzaSyApPIwpTGVlJHo9yoeUGA-DP5LmL6hQfOY',
                'clientId': '969698390976-vvkd5mt2qp2ufevbgd7omup366i9ph9d.apps.googleusercontent.com',
                'scope': self.scope
            }).then(function () {
                self.GoogleAuth = gapi.auth2.getAuthInstance();
                // self.GoogleAuth.isSignedIn.listen(self.checkStatus);
                self.GoogleAuth.currentUser.listen(self.checkStatus);
            });
        },
        signIn(){
            // if(this.GoogleAuth.isSignedIn.get()){
                // console.log('he');
                // this.GoogleAuth.signOut();
                // this.GoogleAuth.signIn();
                // this.checkStatus();
            // }else{
                this.GoogleAuth.signIn();
            // }
        },
        // signOut(){
            // this.GoogleAuth.disconnect();
            // this.GoogleAuth = gapi.auth2.getAuthInstance();
            // console.log('signout',this.GoogleAuth);
        // },
        checkStatus(){
            // if(this.GoogleAuth.isSignedIn.get()){
            var user = this.GoogleAuth.currentUser.get();
            // console.log('user',user);
            
            var user = user.getBasicProfile();
			this.updateData({
				url:this.$baseurl+'lit/app/auth/GoogleAuthLogin',
				method:'post',
				data:{email:user.getEmail()},
				success:this.success
			});
        }
    }
});