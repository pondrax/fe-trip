app.component('app-form',{
	name:'AppForm',
	template : `	
		<form v-if="data.show" :class="$attrs.class||'white shadow p-4 mb-3'" @submit.prevent="submitForm()">
		
			<a v-if="toggle!==false" class="right h4" @click="reset">&times;</a>
			<slot :form="data.form||{}" :error="error" :reset="reset"></slot>
		</form>
	`,
	props	: ['url','method','data','toggle','success','fail','id'],
	data(){
		return {
			error: {}
		}
	},
	methods	:{
		submitForm(){
			this.updateData({
				url:this.url,
				id:this.id,
				method:this.method,
				data:this.data.form,
				success:this.success,
				fail:this.fail
			});
		}
	}
});


app.component('app-modal',{
	name:'AppModal',
	template : `
		<div v-if="data.show" class="modal active">
			<div class="overlay absolute top-left bottom-right"></div>
			<article class="p-4 overflow-y" style="width:100%;max-width:75vw;max-height:100vh">
				<a class="right h4" @click="reset">&times;</a>
				<form @submit.prevent="submitForm()">
					<slot :form="data.form||{}" :error="error" :reset="reset"></slot>
				</form>
			</article>
		</div>
	`,
	props	: ['url','method','data','toggle','success','fail','closeable','id'],
	data(){
		return {
			error: {}
		}
	},
	methods	:{
		submitForm(){
			this.updateData({
				url:this.url,
				id:this.id,
				method:this.method,
				data:this.data.form,
				success:this.success,
				fail:this.fail
			});
		}
	}
});
