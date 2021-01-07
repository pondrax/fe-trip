app.component('app-chart',{
	name:'AppChart',
	props: ['height', 'width', 'type', 'datasets','labels', 'options'],
	data() {
		return {
				colors:[
					'#ff6f61',
					'#2196f3',
					'#45b8ac',
					'#f1c40f',
					'#6b5b95',
					'#88b04b',
					'#379F7A',
					'#CC2738',
					'#8B628A',
					'#8FBE00',
					'#606060'
				],
				baseurl:this.$baseurl,
				chart:null,
				typeChart:'bar',
				data:{},
				chart:null
		};
	},
	watch: {
		datasets(val) {
			this.setData(val);
			// console.log(val)
			if(this.chart){
				this.chart.update()
			}
		},
		labels(val) {
				this.setLabels(val);
				if(this.chart){
					this.chart.update()
				}
		},
		type(val,old){
			if(val!=old){
				var self=this;
				head.ready(function(){
					self.typeChart=val;
					self.initChart(val)
				})
			}
			// console.log(val,old)
		}
	},
	mounted() {
		var self=this;
				
		load([
			this.$asset('css/lib/chart.min.css'),
			this.$asset('js/lib/chart/chart.min.js')
		]).then(r=>{
			Chart.helpers.merge(Chart.defaults.global, {
				aspectRatio: 16/9,
				responsive:true,
				// tooltips: false,
				layout: {
					padding: {
						top: 0,
						right: 30,
						bottom: 0,
						left: 0
					}
				},
				elements: {
					line: {
						fill: false
					},
					radar: {
						fillColor: 'red'
					}
				},
				legend: {
					display: false,
				},
				tooltips: {
					mode: "index",
					intersect: false,
						},
						plugins: {
					crosshair: {
					sync: {
					  enabled: false
					},
				},
					datalabels: {
						backgroundColor: function(context) {
							return context.dataset.backgroundColor;
						},
						borderRadius: 4,
						color: 'white',
						font: {
							weight: 'bold'
						},
						formatter: Math.round,
						align:'end',
						anchor:'end'
					}
				}
			});
			self.setLabels(self.labels);
			self.setData(self.datasets);
			// console.log(this.type)
			self.initChart(self.type)
			// console.log(self.chart)
		});
	},
	methods:{
		initChart(val){
			if(this.chart){
				this.chart.destroy();
			}
			// console.log(this.data.datasets);
			if(['doughnut','pie','radar','polarArea'].indexOf(this.type)>=0){
				this.options={...this.options,plugins:{crosshair:false}};
			}
			this.chart = new Chart(this.$refs.chart.getContext('2d'), {
				type: this.type,
				data: this.data,
				options: this.options,
			});
		},
		setData(sets){
			/* Inject Default Colors */
			this.data.datasets=sets.map((data,id)=>{
				if(['doughnut','pie','polarArea'].indexOf(this.type)>=0){
					var color=this.colors.concat(this.colors).slice(0,data.data.length);
					var borderColor=color.sort(()=>Math.random()-0.5);
					var backgroundColor=borderColor.map(color=>color+'9c');
				}else{
					var color=this.colors.concat(this.colors)[id];
					var borderColor=color;
					var backgroundColor=borderColor+'cc';
				}
				
				return {...data,backgroundColor,borderColor}
			})
		},
		setLabels(labels){
			this.data.labels=labels;
		}
	},
	template:`
		<div>
			<canvas ref="chart" :height="height"></canvas>
		</div>
	`
});