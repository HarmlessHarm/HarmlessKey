<template>
	<div id="targeted">
		<h2 class="componentHeader" :class="{ shadow : setShadow > 0 }">

			<div class="d-flex justify-content-between">
				<span><i class="fas fa-crosshairs"></i> Targeted</span>
				<a v-if="targeted.length > 0" @click="set_targeted({type: 'untarget', key: 'all'})">
					<i class="fas fa-times red"></i>
					<q-tooltip anchor="top middle" self="center middle">
						Untarget all
					</q-tooltip>
				</a>
			</div>

			<!-- SINGLE TARGET OPTIONS -->
			<div class="options d-flex justify-content-between" v-if="target">
				<a @click="setSlide({show: true, type: 'slides/encounter/DamageHealing' })"
					v-shortkey="['d']" @shortkey="setSlide({show: true, type: 'slides/encounter/DamageHealing' })">
					<span class="icon"><i class="fas fa-swords"></i></span>
					<q-tooltip anchor="top middle" self="center middle">
						[d] Do damage / healing
					</q-tooltip>
				</a>
				<a @click="setSlide({show: true, type: 'slides/encounter/Conditions'})"
					v-shortkey="['c']" @shortkey="setSlide({show: true, type: 'slides/encounter/Conditions'})">
					<span class="icon"><i class="fas fa-flame"></i></span>
					<q-tooltip anchor="top middle" self="center middle">
						[c] Conditions
					</q-tooltip>
				</a>
				<a @click="setSlide({show: true, type: 'slides/encounter/reminders/TargetReminders' })"
					v-shortkey="['m']" @shortkey="setSlide({show: true, type: 'slides/encounter/reminders/TargetReminders' })"
				>
					<span class="icon"><i class="fas fa-stopwatch"></i></span>
					<q-tooltip anchor="top middle" self="center middle">
						[m] Reminders
					</q-tooltip>
				</a>
				<a @click="setSlide({show: true, type: 'slides/Transform', data: target })"
					v-shortkey="['t']" @shortkey="setSlide({show: true, type: 'slides/Transform', data: target })"
				>
					<span class="icon"><i class="fas fa-paw-claws"></i></span>
					<q-tooltip anchor="top middle" self="center middle">
						[t] Transform
					</q-tooltip>
				</a>

				<a @click="setHidden()"
					v-shortkey="['h']" @shortkey="setHidden()"
				>
					<span class="icon"><i class="fas fa-eye"></i></span>
					<q-tooltip anchor="top middle" self="center middle">
						[h] Hide
					</q-tooltip>
				</a>
				
				<a 
					@click="setSlide({show: true, type: 'slides/encounter/EditEntity' })" 
					v-shortkey="['e']" @shortkey="setSlide({show: true, type: 'slides/encounter/EditEntity' })"
				>
					<span class="icon"><i class="fas fa-pencil"></i></span>
					<q-tooltip anchor="top middle" self="center middle">
						[e] Edit
					</q-tooltip>
				</a>
			</div>

			<!-- MULTITARGET OPTIONS -->
			<div class="options d-flex justify-content-between" v-else-if="targeted.length > 0">
				<a @click="setSlide({show: true, type: 'slides/encounter/DamageHealing'})"
					v-shortkey="['d']" @shortkey="setSlide({show: true, type: 'slides/encounter/DamageHealing'})"
				>
					<span class="icon"><i class="fas fa-swords"></i></span>
					<q-tooltip anchor="top middle" self="center middle">
						[d] Do damage / healing
					</q-tooltip>
				</a>
				<a 
					@click="setSlide({show: true, type: 'slides/encounter/Conditions'})"
					v-shortkey="['c']" @shortkey="setSlide({show: true, type: 'slides/encounter/Conditions'})"
				>
					<span class="icon"><i class="fas fa-flame"></i></span>
					<q-tooltip anchor="top middle" self="center middle">
						[c] Conditions
					</q-tooltip>
				</a>
				<a 
					@click="setSlide({show: true, type: 'slides/encounter/reminders/TargetReminders'})"
					v-shortkey="['m']" @shortkey="setSlide({show: true, type: 'slides/encounter/reminders/TargetReminders'})"
				>
					<span class="icon"><i class="fas fa-stopwatch"></i></span>
					<q-tooltip anchor="top middle" self="center middle">
						[m] Reminders
					</q-tooltip>
				</a>

				<a @click="setHidden()"
					v-shortkey="['h']" @shortkey="setHidden()"
				>
					<span class="icon"><i class="fas fa-eye"></i></span>
					<q-tooltip anchor="top middle" self="center middle">
						[h] Hide
					</q-tooltip>
				</a>

				<a 
					@click="setSlide({show: true, type: 'slides/encounter/EditEntity' })" 
					v-shortkey="['e']" @shortkey="setSlide({show: true, type: 'slides/encounter/EditEntity' })"
				>
					<span class="icon"><i class="fas fa-pencil"></i></span>
					<q-tooltip anchor="top middle" self="center middle">
						[e] Edit
					</q-tooltip>
				</a>
			</div>
		</h2>
		<q-scroll-area dark :thumb-style="{ width: '5px'}" v-on:scroll="shadow()" ref="scroll">
			<div class="current">
				<!-- SINGLE TARGET -->
				<template v-if="targeted.length === 1">
					<TargetInfo :data="{ key: targeted[0] }" />
				</template>

				<!-- MULTIPLE TARGETS -->
				<template v-else-if="targeted.length > 1">
					<div v-for="key in targeted" :key="`target-${key}`" class="target">
						<div class="health">
							<TargetItem :item="key" />
							<a class="clear bg-gray-dark" @click="set_targeted({type: 'untarget', key})">
								<i class="fas fa-times red"></i>
								<q-tooltip anchor="top middle" self="center middle">
									Untarget
								</q-tooltip>
							</a>
						</div>
						<div class="scores">
							<template v-for="(ability, index) in abilities">
								<div
									:key="`score-${index}`" 
									v-if="entities[key][ability]"
									class="ability"
								>
									<hk-roll 
										tooltip="Roll check"
										:roll="{
											d: 20, 
											n: 1, 
											m: modifier(entities[key][ability]), 
											title: `${ability.capitalize()} check`, 
											entity_name: entities[key].name.capitalizeEach(), 
											notify: true
										}"
										:share="shares.includes('ability_rolls') ? { 
											encounter_id: encounterId,
											entity_key: key
										} : null"
									>
										<div class="abilityName">{{ ability.substring(0,3).toUpperCase() }}</div>
										<div class="mod bg-gray-dark">
											{{ modifier(entities[key][ability]) }}
										</div>
									</hk-roll>
									<hk-roll
										tooltip="Roll save"
										:roll="{
											d: 20, 
											n: 1, 
											m: savingThrow(entities[key], ability), 
											title: `${ability.capitalize()} save`,
											entity_name: entities[key].name.capitalizeEach(), 
											notify: true
										}"
										:share="shares.includes('save_rolls') ? { 
											encounter_id: encounterId,
											entity_key: key
										} : null"
									>
										<div class="mod bg-gray-dark">
											{{ savingThrow(entities[key], ability) }}
										</div>
									</hk-roll>
								</div>
							</template>
						</div>
					</div>
				</template>
				<div v-else class="noTargetInfo">
					<h3 class="red">No target selected</h3>
					<p> Select at least 1 target from the target list to perform targeted actions.</p>

					<p><b>Selecing a target</b><br/>Click on an entity in the target list, or use [0-9] on your keyboard to target it.</p>
					<p><b>Multi-targeting</b><br/>Hold down shift and click on multiple entities to target them all at once.</p>
					<p><b>Cycle through targets</b><br/>Use the up and down arrow keys on your keyboard to cycle through the targets. Hold shift to select multiple targets in a row.</p>
				</div>
			</div>
		</q-scroll-area>
	</div>
</template>

<script>
	import { mapActions, mapGetters } from 'vuex'
	import { dice } from '@/mixins/dice.js';
	import { abilities } from '@/mixins/abilities.js';
	import TargetItem from '@/components/combat/TargetItem.vue';
	import TargetInfo from '@/components/combat/TargetInfo.vue';
	import { experience } from '@/mixins/experience.js';
	

	export default {
		name: 'Targeted',
		mixins: [dice, experience, abilities],
		components: {
			TargetItem,
			TargetInfo
		},
		data() {
			return {
				setShadow: 0,
			}
		},
		computed: {
			...mapGetters([
				'encounterId',
				'entities',
				'turn',
				'targeted',
				'broadcast'
			]),
			shares() {
				return this.broadcast.shares || [];
			},
			target: function() {
				if(this.targeted.length === 1) {
					return this.entities[this.targeted[0]];
				}
			},
			death_fails() {
				let fails = 0;
				for(let key in this.target.saves) {
					if(this.target.saves[key] === 'fail') {
						fails++
					}
				}
				return fails;
			}
		},
		methods: {
			...mapActions([
				'set_targeted',
				'setSlide',
				'set_save',
				'set_dead',
				'set_stable',
				'set_targetReminder',
				'set_hidden'
			]),
			showCondition(show) {
				event.stopPropagation();
				this.setSlide({
					show: true,
					type: 'condition',
					condition: show,
					entity: this.target
				})
			},
			edit(key, entityType) {
				let editType = undefined;
				switch(entityType) {
					case 'player':
						editType = 'slides/EditPlayer';
						break;
					case 'companion':
						editType = 'slides/encounter/EditCompanion';
						break;
					case 'npc':
						editType = 'slides/encounter/EditNpc';
						break;
				}

				event.stopPropagation();
				this.setSlide({
					show: true,
					type: editType,
					data: {
						key: key,
						location: 'encounter'
					}
				})
			},
			setHidden() {
				for(const key of this.targeted) {
					this.set_hidden({
						key,
						hidden: !this.entities[key].hidden
					});
				}
			},
			percentage(current, max) {
				var hp_percentage = Math.floor(current / max * 100)
				return hp_percentage
			},
			shadow() {
				this.setShadow = this.$refs.scroll.scrollPosition;
			},
			save(check, index) {
				this.set_save({
					key: this.target.key,
					check: check,
					index
				})
			},
			kill_revive(action) {
				this.set_dead({
					key: this.target.key,
					action: action,
					revive: true
				})
			},
			stabilize() {
				this.set_stable({
					key: this.target.key,
					action: 'set',
				})
			},
			displayStats(target) {
				var stats = '';
				if(target.transformed == true) {
					stats = {
						ac: target.transformedAc,
						maxHp: target.transformedMaxHp,
						curHp: target.transformedCurHp,
					}
				}
				else {
					stats = {
						ac: target.ac,
						maxHp: target.maxHp,
						curHp: target.curHp,
					}
				}
				return stats
			},
			modifier(score) {
				let mod = Math.floor((score - 10) / 2);
				return (mod > 0) ? `+${mod}` : mod;
			},
			savingThrow(entity, ability) {
				let proficiency;
				if(entity.entityType === "player") {
					proficiency = this.returnProficiency(entity.level ? entity.level : this.calculatedLevel(entity.experience)) 
				} else {
					proficiency = entity.proficiency;
				}
				const save = (entity.saving_throws && entity.saving_throws.includes(ability)) 
					? parseInt(this.modifier(entity[ability])) + proficiency 
					: parseInt(this.modifier(entity[ability]));
				return (save > 0) ? `+${save}` : save;
			}
		}
	}
</script>

<style lang="scss" scoped>
#targeted {
	background: rgba(38, 38, 38, .9);
	grid-area: targeted;
	overflow: hidden;
	
	.noTargetInfo {
		font-size: 15px;
		line-height: 25px;
	}
	.current {
		padding: 12px 10px 15px 10px;
		width: calc(100% - 5px);
	}
	.q-scrollarea {
		height: calc(100% - 110px);
	}
	h2.componentHeader {
		padding: 10px 15px 10px 10px !important;
		margin-bottom: 0 !important;

		&.shadow {
			box-shadow: 0 0 10px rgba(0,0,0,0.9); 
		}
	}
	.btn.save {
		width: 49.5%;
	}
	.health {
		display: grid;
		grid-template-columns: 1fr 35px;
		grid-template-rows: 35px;
		grid-gap: 0;
		background:$gray-dark;

		.clear {
			display: block;
			width: 35px;
			height:35px;
			line-height: 35px;
			font-size: 15px;
			text-align: center;
		}
	}
	.target {
		margin-bottom: 10px;
		border: solid 1px$gray-dark;
		
		.scores {
			width: 100%;
			display: grid;
			grid-template-columns: repeat(6, 1fr);
			user-select: none;
			grid-column-gap: 1px;
	
			.ability {
				margin-top: 5px;
				text-align: center;

				.abilityName {
					margin-bottom: 3px;
				}
				.mod {
					cursor: pointer;
					line-height: 25px;
					margin-top: 1px;
				}
				.advantage .mod:hover {
					color:$white;
					background-color: $green !important;
				}
				.disadvantage .mod:hover {
					color:$white;
					background-color:$red !important;
				}
			}
		}
	}
	.options {
		margin: 20px -3px 0 -3px;

		a {
			background-color: $gray-light;
			margin: 0 3px;
			display: block;
			width: 100%;
			text-align: center;
			color:$gray-dark !important;
			line-height: 35px;
			font-size: 15px;

			&:hover {
				background:$gray-hover;
				color:$white !important;
			}
		}
	}
	.conditions {
		margin: 2px 0 10px 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, 30px);
		grid-auto-rows: 30px;
		grid-gap: 1px;

		svg, .n {
			display: block;
			font-size: 16px;
			width: 30px;
			height: 30px;
			line-height: 26px;
			text-align: center;
			fill:$red;
			color:$red;
			background-color:$gray-active;
			padding: 2px;
			cursor: pointer;
		}
	}
}
@media only screen and (max-width: 900px) {
	#targeted {
		display: none;
	}
}
@media only screen and (max-width: 600px) {
	#targeted, .scroll, .current {
		overflow: visible !important;
	}
	.hide {
		display: none;
	}
}

</style>