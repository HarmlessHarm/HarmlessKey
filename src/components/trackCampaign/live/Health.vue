<template>
	<div v-if="campPlayers && campPlayers && players && npcs && (health.curHp > 0 || entity.entityType == 'npc')">
		<span class="hp">
			<span v-if="isTransformed(entity, camp_data)" class="mr-1">
				<i class="fas fa-paw-claws"></i>
				<q-tooltip anchor="top middle" self="center middle">
					Transformed
				</q-tooltip>
			</span>
			<span class="current" :class="{ 
				'red': percentage(health.curHp, health.maxHp) <= 33, 
				'orange': percentage(health.curHp, health.maxHp) > 33 && percentage(health.curHp, health.maxHp) <= 76, 
				'green': percentage(health.curHp, health.maxHp) > 76
				}">
					<hk-animated-integer :value="health.curHp" />
				</span>
				<span class="gray-hover">/</span><span :class="{ 
					'green': (entity.entityType === 'player' || entity.entityType === 'companion') && camp_data.maxHpMod > 0, 
					'red': (entity.entityType === 'player' || entity.entityType === 'companion') && camp_data.maxHpMod < 0
				}">{{ health.maxHp }}
				</span>
			<template v-if="health.tempHp">
				+{{ health.tempHp }}
			</template>
		</span>
	</div>
	<div v-else>
		<div v-if="camp_data.stable" class="green">
			<span><i class="fas fa-fist-raised"></i> Stable</span>
		</div>
		<div v-else-if="camp_data.dead" class="red">
			<span><i class="fas fa-skull-crossbones"></i> Dead</span>
		</div>
		<div v-else class="hp d-flex justify-content-start">
			<div v-for="(check, key) in camp_data.saves" v-bind:key="key" class="mr-1">
				<span v-show="check == 'succes'" class="save green"><i class="fas fa-check"></i></span> 
				<span v-show="check == 'fail'" class="save red"><i class="fas fa-times"></i></span>
			</div>
		</div>
	</div>
</template>

<script>
	import { general } from '@/mixins/general.js';
	import { trackEncounter } from '@/mixins/trackEncounter.js';

	export default {
		name: 'Health',
		mixins: [general, trackEncounter],
		props: [
			'entity',
			'campPlayers',
			'campCompanions',
			'npcs',
			'players',
		],
		data() {
			return {
				userId: this.$route.params.userid,
			}
		},
		computed: {
			camp_data: function() {
				const key = this.entity.key;
				
				if (this.entity.entityType === 'player')
					return this.campPlayers[key];

				if (this.entity.entityType === 'companion')
					return this.campCompanions[key];

				return undefined;
			},
			health: function() {
				let ret = {};
				const key = this.entity.key;

				let maxHp, curHp, tempHp;

				if (this.isTransformed(this.entity, this.camp_data)) {
					maxHp = (this.camp_data !== undefined) ? this.camp_data.transformed.maxHp : this.entity.transformed.maxHp;
					curHp = (this.camp_data !== undefined) ? this.camp_data.transformed.curHp : this.entity.transformed.curHp;
					tempHp = (this.camp_data !== undefined) ? this.camp_data.tempHp : this.entity.tempHp;
				}

				// Not transformed
				else {
					// Fill cur and temp first from campaign or entity data
					curHp = (this.camp_data !== undefined) ? this.camp_data.curHp : this.entity.curHp;
					tempHp = (this.camp_data !== undefined) ? this.camp_data.tempHp : this.entity.tempHp;

					// Npc max hp in entity
					if (this.entity.entityType === 'npc')
						maxHp = (this.entity.maxHpMod) ? parseInt(this.entity.maxHp) + this.entity.maxHpMod : this.entity.maxHp;

					else if (this.entity.entityType === 'player')
						maxHp = (this.camp_data.maxHpMod) ? parseInt(this.players[key].maxHp) + this.camp_data.maxHpMod : this.players[key].maxHp;

					else if (this.entity.entityType === 'companion')
						maxHp = (this.camp_data.maxHpMod) ? parseInt(this.npcs[key].maxHp) + this.camp_data.maxHpMod : this.npcs[key].maxHp;
				}

				ret = {
					maxHp: parseInt(maxHp),
					curHp: parseInt(curHp),
					tempHp: parseInt(tempHp),
				};
				return ret;
			}
		}
	}
</script>

<style lang="scss" scoped>
	.table {
		border-collapse: separate; 
		border-spacing: 0 5px;

		tr:first-child {
			td {
				border-top: solid 1px $blue !important;
				border-bottom: solid 1px $blue !important;
			}
			td:first-child {
				border-left: solid 1px $blue !important;
			}
			td:last-child {
				border-right: solid 1px $blue !important;
			}
		}
		tr {
			td {
				background: rgba(38, 38, 38, .9);
			}
			td.ac, th.ac {
				width: 30px;
				text-align: center;
			}
			td.ac {
				font-weight: bold;
			}
			td.name {
				width: 1%;
				white-space: nowrap;
			}
			td.img {
				width: 45px;
				background-size: cover;
				background-position: center top;
			}
		}
		tr td:first-child, thead th {
			text-align: center;
			color:$white;
			background: none;
			text-shadow: 0 0 3px $black;
		}
	}
	.conditions {
		padding: 9px 10px;

		svg {
			width: 24px;
			height: 24px;
			fill:$red;
			padding: 2px;
			cursor: pointer;
			margin: 0;
		}
	}
	.entities-move {
		transition: transform .6s;
	}
</style>
