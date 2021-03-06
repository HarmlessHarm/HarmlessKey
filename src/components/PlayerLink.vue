<template>
	<div>
		<div class="share" :class="{ small: is_small }" ref="share">
			<div class="qr">
				<vue-qr :text="copy" qid="testid" :size="110" colorLight="true" :margin="5"></vue-qr>
			</div>
			<div>
				<h2>Share live initiative list</h2>
				<p @click="showInfo = !showInfo">
					Let your players follow your encounters. 
					<a>
						<i class="fas fa-info-circle"></i>
					</a>
				</p>
				<q-slide-transition>
					<p v-show="showInfo">
						With this link your active encounter can be followed on different devices. 
						Send it to your players so they can see it on their tablets or phones, 
						or put it up on a second screen that everyone can see. 
						You control what is displayed on the link through the <router-link to="/settings#track">settings</router-link>.
					</p>
				</q-slide-transition>
				<q-input
					dark filled square dense
					:value="copy"
					autocomplete="off"
					type="text"
				>
					<q-icon v-if="!share_available" slot="append" size="xs" class="blue pointer" @click="copyLink()" name="fas fa-copy">
						<q-tooltip anchor="top middle" self="center middle">
							Click to copy
						</q-tooltip>
					</q-icon>
					<q-icon v-else slot="append" size="xs" class="blue pointer" @click="share()" name="fas fa-share-alt">
						<q-tooltip anchor="top middle" self="center middle">
							Click to share
						</q-tooltip>
					</q-icon>
				</q-input>
				<input :value="copy" id="copy" type="hidden" />
			</div>
		</div>
		<small>
			Make sure your campaign is set to <span class="green">Public</span>, or your followers won't be able to see it.
			Then click the <span class="live">LIVE</span> icon in your campaign to share the initiative of the encounter that is active. You can stay live for your entire session, whenever you're not running an encounter, followers won't see what you're doing.
		</small>
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
				is_small: false,
				showInfo: false,
				copy: window.origin + '/user/' + this.$store.getters.user.uid,
			}
		},
		computed: {
			share_available() {
				return navigator.share !== undefined;
			}
		},
		methods: {
			setSize() {
				let width = this.$refs.share.clientWidth
				let small = 450;

				this.is_small = (width <= small) ? true : false;

				//sets new width on resize
				this.width = this.$refs.share.clientWidth;
			},
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
			share() {
				if (navigator.share) {
					navigator.share({
						title: 'Harmless Key',
						text: 'Follow my campaigns on Harmless Key!',
						url: this.copy,
					})
					.catch((error) => console.log('Error sharing', error));
				}
			},
		},
		mounted() {
			this.$nextTick(function() {
				window.addEventListener('resize', this.setSize);
				//Init
				this.setSize();
			});
		},
		beforeDestroy() {
			window.removeEventListener('resize', this.setSize);
		}
	}
</script>

<style lang="scss" scoped>
	.share {
		display: grid;
		grid-template-columns: 110px auto;
		grid-gap: 20px;
		margin-bottom: 20px;

		.copy {
			word-break: break-all;
		}

		&.small {
			grid-template-columns: 1fr;
			grid-template-rows: auto auto;

			.qr {
				display: flex;
				justify-content: center;
				border: solid 1px$gray-hover;
				width: 100%;
				padding: 20px 0;
			}
		}
	}
	.home {
		.share {
			grid-template-columns: auto 110px;
			grid-template-areas: "text qr";

			.qr {
				grid-area: qr;
				border: none;
			}
			p {
				margin-bottom: 10px;
			}
			h2 {
				font-size: 25px;
				font-family: 'Fredericka the Great', cursive;
			}
			small {
				line-height: initial;
			}
		}
	}
</style>