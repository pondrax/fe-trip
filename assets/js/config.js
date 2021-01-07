
/* [GLOBAL] Variable */			
const config = {
	$name		: 'Travel Passport',
	$apiurl		: 'http://localhost/travpas/public/',
	$baseurl	: 'http://localhost/frontend/',
	$apikey		: 'asdasdasdhkj23askdjklqlwkoououasdkhklha',
	$menu		: {}
};

const start=()=>{
	app.config.globalProperties = config;
	APP = app.mount('#APP');				
};

const logout = app.config.globalProperties.$logout = ()=>{
	localStorage.clear();
	window.location.href = config.$baseurl;
};

if(typeof LOGGED != 'undefined'){
	if(APP_TOKEN =  localStorage.getItem(config.$apikey)){
		// http(config.$apiurl+'cmenu').then((response)=>{
			// console.log(response);
		// });
	}else{
		logout();
	};
}

/* [APP] Ready */
$.ready(()=>{				
	start();
});