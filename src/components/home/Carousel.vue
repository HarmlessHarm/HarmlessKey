<template>
	<hk-card>
		<q-carousel
			v-model="current"
			swipeable
			animated
			transition-prev="slide-right"
			transition-next="slide-left"
			control-color="gray-light"
			navigation
			padding
			arrows
			infinite
			class="transparent"
		>
			<q-carousel-slide
				v-for="({name, icon, title, text}, index) in slides"
				:name="name" 
				:key="`slide-${index}`"
				class="column no-wrap flex-center"
			>	
				<i class="icon" :class="icon" />
				<h3 v-html="title" />
				<p v-html="text" />
				<router-link v-if="name === 'more'" to="sign-up" class="btn bg-green" >Create account</router-link>
				<router-link v-if="name === 'weather'" to="weather-demo" class="btn bg-green" >Weather demo</router-link>
			</q-carousel-slide>
		</q-carousel>

		<div class="card-footer text-center" slot="footer">
			<router-link to="/demo" class="btn btn-block">
				Try demo encounter
			</router-link>
		</div>
	</hk-card>
</template>

<script>
	export default {
		name: 'Carousel',
		props: {
			slide: {
				type: String,
				required: true
			},
			slides: {
				type: Array,
				required: true
			}
		},
		data() {
			return {
				current: this.slide
			}
		}
	}
</script>

<style lang="scss" scoped>
	.card-footer {
		padding: 0 !important;
	}
	.q-carousel {
		text-align: center;
		margin: -20px;

		.icon {
			font-size: 40px;
			margin-bottom: 25px;
		}
		h3 {
			font-family: 'Fredericka the Great', cursive;
			color: $white;
			font-size: 25px;
		}
	}
</style>