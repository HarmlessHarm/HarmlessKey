<template>
	<div class="track-wrapper" >
		
		<!-- ROLL FOR INITIATIVE -->
		<RollForInitiative v-if="encounter.round === 0" />

		<!-- ACTIVE ENCOUNTER -->
		<template v-else>
			<Turns 
				:encounter="encounter" 
				:current="_non_hidden_targets[0]"
				:entities_len="Object.keys(_turnCount).length"
				:turn="turn"
				:campPlayers="campaign.players"
				:campCompanions="campaign.companions"
				:players="players"
				:npcs="npcs"
				:playerSettings="playerSettings"
				:npcSettings="npcSettings"
				@setWeather="setWeather"
			/>

			<!-- DESKTOP -->
			<div class="track desktop" v-if="width > 576">
				<div class="initiative">
					<Initiative 
						v-if="!encounter.finished"
						:encounter="encounter" 
						:targets="_non_hidden_targets"
						:allEntities="_turnCount"
						:turn="turn"
						:campPlayers="campaign.players"
						:campCompanions="campaign.companions"
						:players="players"
						:npcs="npcs"
						:playerSettings="playerSettings"
						:screenWidth="width"
						:npcSettings="npcSettings"
					/>
					<Rewards v-else :encounter="encounter"/>
				</div>
				<div class="side">
					<q-scroll-area dark :thumb-style="{ width: '5px'}" class="during-encounter">
						<div class="meters-wrapper">
							<Meters 
								v-if="sideDisplay === 'damage' && playerSettings.meters === undefined"
								:entities="encounter.entities" 
								:npcs="npcs" 
								:players="players"
								:npcSettings="npcSettings"
							/>
						</div>
					</q-scroll-area>
				</div>
				<div class="shares-bar" :class="{ shown: showShares }">
					<div class="show" @click="showShares = !showShares">
						<i class="fas fa-chevron-left" />
					</div>
					<Shares 
						:shares="shares" 
						:encounterId="encounter.key" 
						:entities="encounter.entities" 
						:npcs="npcs" 
						:players="players"
						:npcSettings="npcSettings"
					/>
				</div>
			</div>

			<!-- MOBILE -->
			<div v-else class="track mobile">
				<div class="bg-gray-dark">
					<q-select
						dark filled square
						v-model="panel"
						:options="panels"
					>
						<template v-slot:selected>
							<q-item>
								<q-item-section avatar>
									<q-icon :name="panels.filter( item => { return item.value === panel })[0].icon"/>
								</q-item-section>
								<q-item-section>
									<q-item-label v-html="panels.filter( item => { return item.value === panel })[0].label"/>
								</q-item-section>
							</q-item>
						</template>
						<template v-slot:option="scope">
							<q-item
								clickable
								v-ripple
								v-close-popup
								:active="panel === scope.opt.value"
								@click="panel = scope.opt.value"
							>
								<q-item-section avatar>
									<q-icon :name="scope.opt.icon"/>
								</q-item-section>
									<q-item-label v-html="scope.opt.label"/>
								<q-item-section>
								</q-item-section>
							</q-item>
						</template>
					</q-select>
				</div>
				<q-tab-panels 
					v-model="panel"
					animated
					swipeable
					infinite
					class="transparent-bg"
				>
					<q-tab-panel name="initiative">
						<Initiative 
							v-if="!encounter.finished"
							:encounter="encounter" 
							:targets="_non_hidden_targets"
							:allEntities="_turnCount"
							:turn="turn"
							:campPlayers="campaign.players"
							:campCompanions="campaign.companions"
							:players="players"
							:npcs="npcs"
							:playerSettings="playerSettings"
							:npcSettings="npcSettings"
							:screenWidth="width"
						/>
						<Rewards v-else :encounter="encounter"/>
					</q-tab-panel>
					<q-tab-panel name="meters" v-if="playerSettings.meters === undefined">
						<Meters 
							:entities="encounter.entities" 
							:npcs="npcs" 
							:players="players"
							:npcSettings="npcSettings"
						/>
					</q-tab-panel>
					<q-tab-panel name="shares">
						<Shares 
							:shares="shares" 
							:encounterId="encounter.key" 
							:entities="encounter.entities" 
							:npcs="npcs" 
							:players="players"
							:npcSettings="npcSettings"
						/>
					</q-tab-panel>
				</q-tab-panels>
			</div>
		</template>
		<div 
			v-if="encounter.background || (encounter.weather && Object.keys(encounter.weather).length && weather)"
			class="weather" 
		>
			<Weather :weather="encounter.weather" :background="encounter.background" :show-weather="weather" />
		</div>
	</div>
</template>

<script>
	import _ from 'lodash';
	import { db } from '@/firebase';

	import Turns from './Turns.vue';
	import Initiative from './Initiative.vue';
	import Meters from '../Meters.vue';
	import RollForInitiative from './RollForInitiative.vue';

	export default {
		name: 'live',
		components: {
			Turns,
			Initiative,
			Meters,
			RollForInitiative,
			Shares: () => import('../Shares'),
			Rewards: () => import('./Rewards'),
			Weather: () => import('@/components/weather')
		},
		props: [
			"encounter", 
			"campaign", 
			"players", 
			"width",
			"shares"
		],
		data() {
			return {
				userId: this.$route.params.userid,
				panel: "initiative",
				setSideDisplay: undefined,
				counter: 0,
				rolls: [],
				weather: true,
				showShares: false,
				panels: [
					{
						label: "Initiative list",
						value: "initiative",
						icon: "fas fa-list-ul"
					},
					{
						label: "Damage meters",
						value: "meters",
						icon: "fas fa-swords"
					},
					{
						label: "Shares",
						value: "shares",
						icon: "fas fa-share"
					}
				]
			}
		},
		firebase() {
			return {
				npcs: {
					source: db.ref(`npcs/${this.userId}`),
					asObject: true,
				},
				npcSettings: {
					source: db.ref(`settings/${this.userId}/track/npc`),
					asObject: true,
				},
				playerSettings: {
					source: db.ref(`settings/${this.userId}/track/player`),
					asObject: true,
				}
			}
		},
		computed: {
			//All entities, without hidden entities
			_turnCount() {
				return _.chain(this.encounter.entities)
				.filter(function(entity, key) {
					entity.key = key
					return entity.active && !entity.down && !entity.hidden;
				})
				.orderBy(function(entity) {
					return entity.name
				}, 'asc')
				.orderBy(function(entity){
					return Number(entity.initiative)
				} , 'desc')
				.value()
			},
			_allEntities() {
				return _.chain(this.encounter.entities)
				.filter(function(entity, key) {
					entity.key = key
					return entity.active && !entity.down;
				})
				.orderBy(function(entity) {
					return entity.name
				}, 'asc')
				.orderBy(function(entity){
					return Number(entity.initiative)
				} , 'desc')
				.value()
			},
			_targets() {
				let t = this.encounter.turn
				let turns = Object.keys(this._allEntities)
				let order = turns.slice(t).concat(turns.slice(0,t))
				return Array.from(order, i => this._allEntities[i])
			},
			_non_hidden() {
				return _.chain(this.encounter.entities)
				.filter(function(entity, key) {
					entity.key = key
					return entity.active && !entity.down && !entity.hidden;
				})
				.orderBy(function(entity) {
					return entity.name
				}, 'asc')
				.orderBy(function(entity){
					return Number(entity.initiative)
				} , 'desc')
				.value()
			},
			_hidden_count() {
				return _.filter(this.encounter.entities, function(entity, key) {
					entity.key = key
					return entity.active && !entity.down && entity.hidden;
				}).length
			},
			_non_hidden_targets() {
				let t = this.turn
				let turns = Object.keys(this._non_hidden)
				let order = turns.slice(t).concat(turns.slice(0,t))
				return Array.from(order, i => this._non_hidden[i])
			},
			turn() {	
				let t = this.encounter.turn
				let hidden = 0
				for (let i = 0; i <= t; i++) {
					if (this._allEntities[i].hidden) {
						hidden++;
					}
				}
				// If more hidden then turn it's still turn 0
				if (t - hidden < 0) {
					return 0
				}
				return t - hidden
			},
			tabs() {
				let tabs = [];
				if(this.playerSettings.meters === undefined) {
					tabs.push({
						name: "damage",
						label: "Damage meters",
						icon: "fas fa-swords",
					});
				}
				tabs.push({
					name: "rolls",
					label: "Rolls",
					icon: "fas fa-dice-d20",
				});
				return tabs;
			},
			sideDisplay: {
				get() {
					if(this.setSideDisplay) {
						return this.setSideDisplay;
					}
					return (this.playerSettings.meters === undefined) ? 'damage' : 'rolls';
				},
				set(newValue) {
					this.setSideDisplay = newValue;
				}
			}
		},
		methods: {
			setWeather(value) {
				this.weather = value;
			}
		}
	}
</script>

<style lang="scss" scoped>
.weather {
	overflow: hidden;
	position: absolute; 
	left: 0;
	top: 60px;
	height: calc(100% - 60px);
	width: 100%;
	pointer-events: none;
	background-size: cover;
	background-position: center top;
}
.track {
	margin: auto;
	width: 100%;
	height: calc(100% - 60px);
	display: grid;
	position: relative;
	z-index: 1;
	

	&.desktop {
		grid-template-columns: 3fr 1fr minmax(200px, 250px);
		grid-template-rows: 1fr;
		grid-gap: 15px;

		.initiative {
			padding: 30px 0 0 15px;
			overflow: hidden;

			.q-scrollarea {
				height: calc(100% - 86px);

				> div {
					padding-right: 6px;
				}
			}
		}
		.side {
			overflow: hidden;
			padding-top: 30px;

			.q-scrollarea {
				height: calc(100% - 56px);

				&.during-encounter {
					height: calc(100% - 50px);
				}
			}
		}
		.shares-bar {
			height: 100%;
			
			.show {
				display: none;
			}
			.shares {
				width: 100%;
			}
		}
	}
	&.mobile {
		grid-template-rows: 60px 1fr;
		grid-template-columns: 1fr;

		.transparent-bg {
			background: rgba(38, 38, 38, .3);
		}
		.q-tab-panel {
			padding: 0 15px;
		}
	}

	&::-webkit-scrollbar { 
		display: none; 
	}
}

@media only screen and (max-width: 576px) {
	.weather {
		top: 120px;
		height: calc(100% - 120px);
	}
}
@media only screen and (max-width: 900px) {
	.track.desktop {
		grid-template-columns: 2fr 1fr !important;

		.side {
			padding-right: 15px;
		}
		.shares-bar {
			width: 250px;
			position: absolute;
			right: -250px;
			display: flex;
			justify-content: center;
			transition: all .5s linear;

			.show {
				background-color: $blue;
				color: $white;
				display: block;
				width: 18px;
				text-align: center;
				cursor: pointer;
				height: 50px;
				line-height: 50px;
				position: absolute;
				top: 50%;
				left: -18px;
				transform: translateY(-50%);

				i {
					transition: all .3s linear;
				}
			}
			&.shown {
				right: 0;

				.show {
					i {
						transform: rotate(180deg);
					}
				}
			}
		}
	}
}
@media only screen and (max-width: 992px) {
	.track.desktop {
		grid-template-columns: 3fr 1fr minmax(180px, 200px);
	}
}
@media only screen and (min-width: 1250px) {
	.track.desktop {
		grid-template-columns: 3fr 1fr minmax(250px, 300px);
		grid-gap: 30px;

		.initiative {
			padding-left: 30px;
		}
	}
}
</style>
