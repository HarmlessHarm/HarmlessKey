<template>
	<div>
		<b-card header="Player link">
			<div class="d-flex justify-content-start">
				<vue-qr class="bg-gray" :text="copy" qid="testid" :size="100" colorLight="true" :margin="5"></vue-qr>

				<div class="ml-3">
					<p class="d-flex justify-content-between">
						<span>Let your players follow your encounters.</span>
						<a data-toggle="collapse" :href="'#track'" 
							role="button" aria-expanded="false">
							<i class="fas fa-info"></i>
						</a>
					</p>
					<p class="collapse mb-3" id="track">
						With this link your active encounter can be followed on different devices. 
						Send it to your players so they can see it on their tablets or phones, 
						or put it up on a second screen that everyone can see. 
						You control what is dispayed on the link through the <router-link to="/settings#track">settings</router-link>.
					</p>
				
					<a class="copy" @click="copyLink()" v-b-tooltip.hover title="Click to copy"><i class="fas fa-copy"></i> - {{ copy }}</a>
					<input type="hidden" autocomplete="off" id="copy" :value="copy">
				</div>
			</div>
		</b-card>
	</div>
</template>

<script>
	import VueQr from 'vue-qr'
	
	export default {
		name: 'PlayerLink',
		components: {
				VueQr,
		},
		data() {
			return {
				copy: window.location.host + '/track-encounter/' + this.$store.getters.getUser.uid,
			}
		},
		methods: {
			copyLink() {

				let toCopy = document.querySelector('#copy')
				toCopy.setAttribute('type', 'text') //hidden
				toCopy.select()

				try {
					var successful = document.execCommand('copy');
					var msg = successful ? 'Successful' : 'Unsuccessful';

					this.$snotify.success(msg, 'Link Copied!', {
						position: "rightTop"
					});
				} catch (err) {
					alert('Something went wrong, unable to copy');
				}

				/* unselect the range */
				toCopy.setAttribute('type', 'hidden')
				window.getSelection().removeAllRanges()
			},
		}
	}
</script>

<style lang="scss" scoped>

	.copy {
		word-break: break-all;
	}
</style>