<template>
	<div class="content" v-if="tier && userInfo">
		<div class="row q-col-gutter-md">
			<div class="col-12 col-md-6">
				<hk-card header="Your Profile">
					<div>
						<h4>{{ userInfo.username }}</h4>
						<p class="info">
							<span class="gray-hover">Created:</span> {{ makeDate(user.metadata.creationTime, true) }}<br/>
							<span class="gray-hover">Last login:</span> {{ makeDate(user.metadata.lastSignInTime, true) }}
						</p>
					</div>
					<!-- DATA -->
					<h3>Your data</h3>
					<q-list class="data">
						<!-- Campaigns -->
						<q-item to="/campaigns" class="justify-content-between">
								<div>
									<i class="fas fa-dungeon mr-1"></i> Campaigns
								</div>
								<div>
									<span v-if="campaigns" :class="{ 'green': true, 'red': Object.keys(campaigns).length >= tier.benefits.campaigns }"> {{ Object.keys(campaigns).length }}</span> 
									<span v-else class="green">0</span>
									<span class="gray-hover"> / </span>
									<i v-if="tier.benefits.campaigns == 'infinite'" class="far fa-infinity"></i>
									<span v-else>{{ tier.benefits.campaigns }}</span>
								</div>
						</q-item>

						<!-- Players -->
						<q-item to="/players" class="justify-content-between">
								<div>
									<i class="fas fa-user mr-1"></i> Players
								</div>
								<div>
									<span v-if="players" :class="{ 'green': true, 'red': Object.keys(players).length >= tier.benefits.players }"> {{ Object.keys(players).length }}</span> 
									<span v-else class="green">0</span> 
									<span class="gray-hover"> / </span>
									<i v-if="tier.benefits.players == 'infinite'" class="far fa-infinity"></i>
									<span v-else>{{ tier.benefits.players }}</span>
								</div>
						</q-item>

						<!-- NPC's -->
						<q-item  to="/npcs" class="justify-content-between">
								<div>
									<i class="fas fa-dragon mr-1"></i> NPC's
								</div>
								<div>
									<span v-if="npcs" :class="{ 'green': true, 'red': Object.keys(npcs).length >= tier.benefits.npcs }"> {{ Object.keys(npcs).length }}</span> 
									<span v-else class="green">0</span>
									<span class="gray-hover"> / </span>
									<i v-if="tier.benefits.npcs == 'infinite'" class="far fa-infinity"></i>
									<span v-else>{{ tier.benefits.npcs }}</span>
								</div>
						</q-item>

					</q-list>
					<router-link v-if="tier.name != 'Deity'" class="btn btn-block bg-patreon-red mt-3" to="/patreon">Need more?</router-link>

					<!-- HAS A SUBSCRIPTION -->
					<div v-if="tier && tier.name != 'Free'" class="sub">
						<h3>Your subscription</h3>

						<!-- PATRON -->
						<div v-if="userInfo.patron">
							<hr>
							<h3><i class="fab fa-patreon patreon-red"></i> Patreon: <b>{{ userInfo.patron.tier }}</b></h3>
							<p>Thank you so much for your support. <i class="patreon-red fas fa-heart"></i></p>

							<div v-if="userInfo.patron.last_charge_status === 'Declined' && new Date(userInfo.patron.pledge_end) > new Date()" class="red">
								<h3>Payment Declined</h3>
								<p>
									Your last payment on Patreon was declined, your subscription will automatically be cancelled on <b>{{ makeDate(userInfo.patron.pledge_end) }}</b>.<br/>
									Go to <a href="https://www.patreon.com" target="_blank" rel="noopener">patreon.com</a> to check your payment details.
								</p>
							</div>
							<small><a href="https://www.patreon.com/join/harmlesskey/checkout?edit=1" target="_blank" rel="noopener">Cancel subscription</a></small>
							<hr>
						</div>

						<!-- VOUCHER -->
						<div v-if="voucher">
							<h3><i class="fas fa-ticket-alt"></i> Voucher subscription</h3>
							<p v-if="voucher.message" class="green">{{ voucher.message }}</p>
							<p >Your voucher ends on: 
								<span class="red" v-if="voucher.date">{{ makeDate(voucher.date, false) }}</span>
								<i v-else>never</i>.
							</p>
							<hr>
						</div>

						<!-- TIER -->
						<div>
							<h3 class="mb-1">Subscription tier: <span class="patreon-red">{{ tier.name }}</span></h3>
							<p v-if="tier.name == 'Deity'" class="gray-hover">You have unlimited power.</p>
							<ul class="benefits">
								<li v-for="(benefit, key) in tier.benefits" :key="key">
									<template v-if="key == 'campaigns'">
										<i v-if="benefit == 'infinite'" class="green far fa-infinity"></i>
										<span v-else class="green">{{ benefit }}</span> campaign slots
									</template>
									<template v-if="key == 'encounters'">
										<i v-if="benefit == 'infinite'" class="green far fa-infinity"></i>
										<span v-else class="green">{{ benefit }}</span> encounter slots
									</template>
									<template v-if="key == 'players'">
										<i v-if="benefit == 'infinite'" class="green far fa-infinity"></i>
										<span v-else class="green">{{ benefit }}</span> player slots
									</template>
									<template v-if="key == 'npcs'">
										<i v-if="benefit == 'infinite'" class="green far fa-infinity"></i>
										<span v-else class="green">{{ benefit }}</span> NPC slots
									</template>
									<template v-if="key == 'reminders'">
										<i v-if="benefit == 'infinite'" class="green far fa-infinity"></i>
										<span v-else class="green">{{ benefit }}</span> Reminder slots
									</template>
									<template v-if="key == 'items'">
										<i v-if="benefit == 'infinite'" class="green far fa-infinity"></i>
										<span v-else class="green">{{ benefit }}</span> Item slots
									</template>
								</li>
							</ul>
						</div>
					</div>
					
					<!-- ACTIONS -->
					<hr>
					<div class="actions">
						<p v-if="resetError" class="red text-center"><i class="fas fa-exclamation-triangle"></i> {{ resetError }}</p>
						<p v-if="resetSuccess" class="green text-center"><i class="fas fa-check"></i> {{ resetSuccess }}</p>

						<div class="d-flex justify-content-between">
							<a @click="resetPassword()" class="gray-light"><i class="fas fa-redo-alt blue"></i> Reset Password</a>
							<router-link to="/profile/delete-account" class="gray-light"><i class="fas fa-trash-alt red"></i> Delete account</router-link>
						</div>
					</div>
				</hk-card>
			</div>

			<!-- PLAYER LINK -->
			<div class="col">
				<hk-card>
					<div class="card-header" slot="header">
						<i class="fas fa-link"></i> Player Link
					</div>
					<PlayerLink />
				</hk-card>
			</div>
		</div>

		<hk-card v-if="!tier || (tier && tier.name === 'Free')">
			<div class="card-header" slot="header">
				Support us on Patreon
			</div>
			<p>Get instant access to more storage.</p>
			<Tiers />
		</hk-card>
	</div>
</template>

<script>
	import Tiers from '@/components/Tiers.vue';
	import PlayerLink from '@/components/PlayerLink.vue';
	import { db, auth } from '@/firebase';
	import { general } from '@/mixins/general.js';
	import { mapGetters } from 'vuex';

export default {
		name: 'Profile',
		components: {
			Tiers,
			PlayerLink,
		},
		mixins: [general],
		metaInfo: {
			title: 'Profile'
		},
		data() {
			return {
				error: '',
				resetError: undefined,
				resetSuccess: undefined
			}
		},
		firebase() {
			return {
				tiers: db.ref('tiers').orderByChild('order'),
			}
		},
		computed: {
			...mapGetters([
				'user',
				'campaigns',
				'players',
				'npcs',
				'userInfo',
				'tier',
				'voucher',
			])
		},
		methods: {
			resetPassword() {
				var vm = this;
				var emailAddress = this.user.email;

				auth.sendPasswordResetEmail(emailAddress).then(function() {
					// Email sent.
					vm.resetSuccess = 'An email was sent to ' + emailAddress + ' with a link to reset your password.';
					vm.resetError = undefined;
				}).catch(function(error) {
					// An error happened.
					vm.error = error.message;
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.content {
		.user {
			display: grid;
			grid-template-columns: 120px 1fr;
			
			.img {
				width: 100px;
				height: 100px;
				margin-bottom: 20px;
				border-radius: 50%;
				display: block;
				background-size: cover;
				background-position: center top;
			}
			.info {
				span {
					width: 80px;
					display: inline-block;
				}
			}
		}
		.data {
			margin-bottom: 20px;

			.list-group-item {
				display: flex;
				justify-content: space-between;
			}
		}
		.sub {
			margin-top: 20px;
		}
		.actions {
			a:hover {
				text-decoration: none;
			}
		}

		ul.benefits {
			padding: 0;
			list-style: none;
		}
	}
</style>