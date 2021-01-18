app.component('app-table',{
	name:'AppTable',
	components:{
		'table-filter':{
			name:'TableFilter',
			props:['filter','rows'],
			template:`
					<div class="row gap one two-sm three-md four-lg small">
						<slot name="filter" :filter="filter" :rows="rows"></slot>
					</div>
			`
		},
		'table-toolbar':{
			name:'TableToolbar',
			props:['filter','rows','selected','options','refresh','loading','config'],
			template:`			
					<div class="row one three-md four-lg small">
						<div class="fill">
							<slot name="toolbar" :selected="selected" :rows="rows"></slot>
						</div>
						<div>
							<div class="group w-100">
								<input placeholder="Cari" v-model="options.search">
								<button class="muted" @click="refresh()" data-tooltip="Muat Ulang">
									<i class="feather-refresh-cw"></i>
									{{ loading ? ' &nbsp; Loading..':'' }}
								</button>
								<div class="group dropdown dropdown-right" data-tooltip="Unduh"> 
									<button class="navy" data-dropdown tabindex="0">
										<i class="feather-download"></i>
									</button>	
									<ul class="menu"> 
										<li class="menu-item">
											<a @click="$export('PDF',$parent.$refs.table,config)">
												<i class="feather-book"></i> PDF
											</a>
										</li> 
										<li class="menu-item">
											<a @click="$export('CSV',rows,config)"><i class="feather-book"></i> CSV</a>
										</li> 
										<li class="menu-item">
											<a @click="$export('JSON',rows,config)"><i class="feather-book"></i> JSON</a>
										</li> 
										<li class="menu-item">
											<a @click="$export('XLS',$parent.$refs.table,config)">
												<i class="feather-book"></i> XLS (Excel)
											</a>
										</li> 
										<li class="menu-item">
											<a @click="$export('DOC',$parent.$refs.table,config)">
												<i class="feather-book"></i> DOC (Word)
											</a>
										</li> 
									</ul>
								</div>
							</div>
						</div>
					</div>
			`
		},
		'table-footer':{
			name:'TableFooter',
			props:['info','pagelist','options','total'],
			data(){
				return {current:1}
			},
			computed:{
				max(){
					return Math.ceil(this.total/this.options.limit);
				},
				filteredlist(){
					return this.pagelist.filter((d,i)=> i==0||(d.id<=this.total));
				}
			},
			watch:{
				current(val,old){
					this.current = Math.max(1, Math.min(this.max, val));
					this.options.offset = (this.current-1)*this.options.limit;
				}
			},
			template:`		
			<div class="row one three-sm four-md small mt-3 pt-2 px-2 silver">
				<div class="fill">
					<div class="group">
						<div class="py-1 mr-3">
							Menampilkan {{ info.from }} - {{ info.to }} dari {{ total }}
						</div>
						<v-select v-model="options.limit" :options="filteredlist" keyid="id" keyvalue="val" hint="per halaman" style="width:80px"></v-select>
					</div>
				</div>
				<div>
					<div class="group right">
						<button class="muted" @click="current--">
							<i class="feather-chevron-left"></i>
						</button>
						<v-number v-model.number="current" style="margin-top:-0.5em;width:80px" min="1" :max="max"></v-number>
						<button class="muted" @click="current++">
							<i class="feather-chevron-right"></i>
						</button>
					</div>
				</div>
			</div>
			`
		}
	},
	props:['url','data','option','debug','groupby'],
	data(){
		return {
			loading:false,
			rows:[],
			total:0,
			options : {
				search:'',
				filter:'',
				sort:'t.id',
				order:'desc',
				limit:10,
				offset:0,
			},
			selected:[],
			pagelist:[
				{id:10,val:10},
				{id:25,val:25},
				{id:50,val:50},
				{id:100,val:100},
				{id:250,val:250},
				{id:500,val:500},
				{id:1000,val:1000},
				{id:'',val:'all'}
			],
			columns:this.data.columns,
			filter:this.data.filter || {},
			config:this.data.config
		}
	},
	mounted(){
		if(this.option){
			this.options=Object.assign(this.options,this.option);
		}else{
			this.refresh();
		}
	},
	watch:{
		filter:{
			handler(val,old){
				this.refresh()
			},
			deep : true
		},
		options:{
			handler(val,old){
				this.refresh()
			},
			deep : true
		}
	},
	computed:{
		groupColumn(){
			return (this.groupby||'').split(',');
		},
		groupUnique(){
			return this.groupColumn.find(d=>d.indexOf('+')).split('+');
		},
		filterUrl(){
			var filter = this.filter;
			return Object.keys(filter).map(i=>`filter[${i.replace('__','.')}]=${filter[i]}`).join('&').replace(/undefined/g,'');
		},
		info(){
			return {
				from:this.options.offset+1,
				to:this.options.limit?
					Math.min(this.options.offset+this.options.limit,this.total):
					this.total,
				page:Math.ceil(this.total/this.options.limit)
			}
		},
		selectedData(){
			// return this.selected;
			return this.rows.filter((row,i)=>this.selected[i]);
		}
	},
	methods:{
		refresh(){
			this.loading = true;
			var query=new URLSearchParams(this.options).toString();
			var url = this.url;
			http(url+'/read?'+query+'&'+this.filterUrl)
			.then(json=>{
				// console.log(json);
				this.rows = json.data.rows;
				this.total = json.data.total;
				setTimeout(()=>this.loading = false,1000)
			}).catch(error=>{				
				APP.$refs.LOADER.add(`<b>${error.data.message}</b>`, 'error', -1);
			});
		},
		selectAll(checked){
			if(checked){
				this.selected=Array(this.rows.length).fill(true);
				// console.log(this.selected);
			}else{
				this.selected=[];
			}
		},
		setSort : function (sort){
			this.options.sort=sort;
			this.options.order=this.options.order=='asc'?'desc':'asc';
		},
	},
	template:`
		<div class="p-4 white shadow">
			<div v-if="debug">{{ options }}</div>
			
			<table-filter :filter="filter" :rows="rows">
				<template #filter="{filter,rows}">
					<slot name="filter" :filter="filter" :rows="rows"></slot>
				</template>

			</table-filter>
			
			<table-toolbar :filter="filter" :rows="rows" :selected="selectedData" :options="options" :refresh="refresh" :loading="loading" :config="config">
				<template #toolbar="{selected,rows}">
					<slot name="toolbar" :selected="selected" :rows="rows"></slot>
				</template>
			</table-toolbar>
			
			
			<div class="relative">
				<div class="overflow-y" style="height:50vh">
					<table ref="table">
						<thead>
							<tr>
								<th class="sticky top white" style="width:1%">
									<label class="p-0">
										<input type="checkbox" @input="selectAll($event.target.checked)">
										<span class="checkable p-0 pl-1 pb-1"></span>
									</label>
								</th>
								<th v-for="col in columns" class="sticky top white nowrap">
									{{ col }}
									<button v-if="!['actions','no'].includes(col)" @click="setSort(col)" class="inline link small my-0 mr-2 p-0">
										<span v-if="options.sort!=col" class="text-muted"> <i class="feather-minus-circle"></i> </span>
										<span v-else-if="options.order=='asc'" class="text-error"> <i class="feather-arrow-up-circle"></i></span>
										<span v-else-if="options.order=='desc'" class="text-error"> <i class="feather-arrow-down-circle"></i></span>
									</button>
								</th>
							</tr>
						</thead>
						<tbody>
							<tr v-if="rows.length<1&&!loading">
								<th :colspan="columns.length + 1" class="px-4">
									No Data
								</th>
							</tr>
							<tr v-for="(row,i) in rows">
								<td>
									<label class="p-0">
										<input type="checkbox" v-model="selected[i]"><span class="checkable p-0 pr-1"></span>
									</label>
								</td>
								<td v-for="col in columns">
									<template v-if="groupUnique.includes(col)">
										<template v-if="!((rows[i-1]||{})[groupUnique[0]] == row[groupUnique[0]] && (rows[i-1]||{})[groupUnique[1]] == row[groupUnique[1]])
										">
											<slot :name="col.replace(/[^0-9a-z]/gi, '').toLowerCase()" :data="row" :rows="rows">
												{{ row[col] }}
											</slot>
										</template>
									</template>
									
									<template v-else-if="!( groupColumn.includes(col) && (rows[i-1]||{})[col]==row[col])">
										<slot :name="col.replace(/[^0-9a-z]/gi, '').toLowerCase()" :data="row" :rows="rows">
											{{ row[col] }}
										</slot>
									</template>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
			
			<table-footer :options="options" :info="info" :pagelist="pagelist" :total="total"></table-footer>
			
		</div>
	`
});
