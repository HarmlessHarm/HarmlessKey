<template>
	<div v-if="current">
		<p v-if="targeted.length === 0">No target selected</p>
		<template v-else-if="current.entityType === 'npc' || 'companion'">
			<template v-if="['npc', 'environment'].includes(current.entityType)">
				<div><q-checkbox dark v-model="toHit" label="Roll to hit" indeterminate-value="something-else" /></div>
				<q-checkbox v-if="targeted.length > 1" dark v-model="rollOnce" label="Roll damage once" indeterminate-value="something-else" />
				
				<!-- CUSTOM ROLL -->
				<h3>Custom Roll</h3>
				<div class="custom-roll">
					<div v-if="toHit">
						<q-input 
							dark filled square dense
							label="Hit mod"
							autocomplete="off" 
							type="number" 
							v-model="custom_roll.attack_bonus" 
							name="custom_hit"
							data-vv-as="To Hit Modifier"
						/>
					</div>
					<div :class="{ span: !toHit }">
						<q-input 
							dark filled square dense
							label="Damage dice"
							autocomplete="off" 
							type="text" 
							v-model="custom_roll.damage_dice" 
							name="custom_roll"
							data-vv-as="Custom Roll"
							v-validate="{ regex:/^[0-9]+d[0-9]+(\+[0-9]+d[0-9]+)*$/ }"
						/>
					</div>
					<div>
						<q-input 
							dark filled square dense
							label="Modifier"
							autocomplete="off" 
							type="number" 
							v-model="custom_roll.damage_bonus" 
							name="custom_mod"
							data-vv-as="Custom Modifier"
						/>
					</div>
					<hk-roll 
						tooltip="Roll" 
						tooltipPosition="right"
						@roll="groupRoll($event, custom_roll)"
						:disabled="(errors.items && errors.items.length > 0) || !custom_roll.damage_dice"
					>
						<button 
							:disabled="(errors.items && errors.items.length > 0) || !custom_roll.damage_dice"
							class="btn btn-sm"
						>
							<i class="fas fa-dice-d20"></i>
							<span class="d-none d-md-inline ml-1">Roll</span>
						</button>
					</hk-roll>
				</div>
				<p class="validate red" v-if="errors.has('custom_roll')">
					{{ errors.first('custom_roll') }}
					Allowed format: "2d6" or "2d6+1d8".
				</p>

				<!-- ACTIONS -->
				<div v-for="(action_type, index) in action_types" :key="index" class="action-type">
					<template v-if="current[action_type.value]">
						<h4 class="mt-3">{{ action_type.label }}</h4>
						<ul class="roll">
							<li v-for="(action, index) in current[action_type.value]" :key="index" class="bg-gray-active">
								<span class="d-flex justify-content-between">
									<a class="d-flex justify-content-between gray-light" @click="setShow(action_type.value, index)">
										<span>{{ action.name }}</span>
										<i class="fas fa-caret-down"></i>
									</a>
									<hk-roll 
										:tooltip="`Roll ${action.name}`" 
										tooltipPosition="right"
										@roll="groupRoll($event, action)"
									>
										<button v-if="action['damage_dice']" class="btn btn-sm">
											<i class="fas fa-dice-d20"></i>
											<span class="d-none d-md-inline ml-1">Roll</span>
										</button>
									</hk-roll>
								</span>
								<q-slide-transition>
									<p v-show="active_action === `${action_type.value}-${index}`" class="py-2 pr-1">{{ action.desc }}</p>
								</q-slide-transition>
							</li>
						</ul>
					</template>
				</div>
			</template>
		</template>
		<p v-else-if="current.entityType === 'player'">
			Most players want to roll their own attacks, you probably shouldn't take that away from them. ;)
		</p>
	</div>
</template>

<script>
	import { db } from '@/firebase'
	import { mapGetters, mapActions } from 'vuex'
	import { dice } from '@/mixins/dice.js'
	import { setHP } from '@/mixins/HpManipulations.js'


	export default {
		name: 'Select',
		mixins: [setHP, dice],
		props: ['current'],
		data: function() {
			return {
				rollInfo: false,
				demo: this.$route.name === "Demo",
				userId: this.$store.getters.user ? this.$store.getters.user.uid : undefined,
				campaignId: this.$route.params.campid,
				encounterId: this.$route.params.encid,
				active_action: undefined,
				rollOptions: ['toHit', 'damage'],
				setToHit: undefined,
				rollOnce: true,
				animateTrigger: false,
				rolledDamage: 0,
				rolledToHit: 0,
				custom_roll: {
					name: 'Custom Roll',
					attack_bonus: undefined,
					damage_dice: undefined,
					damage_bonus: undefined
				},
				options: [
					{ label: 'To hit', value: 'toHit' },
					{ label: 'Damage', value: 'damage' },
					{ label: 'Modifiers', value: 'modifiers' },
				],
				action_types: [
					{ label: "Special Abilities", value: 'special_abilities' },
					{ label: 'Actions', value: 'actions' }, 
					{ label: 'Legendary Actions', value: 'legendary_actions' }
				],
				aoeRoll: undefined
			}
		},
		firebase() {
			return {
				criticalSettings: {
					source: db.ref(`settings/${this.userId}/encounter/critical`),
					asObject: true
				},
			}
		},
		computed: {
			...mapGetters([
				'encounter',
				'entities',
				'turn',
				'targeted',
				'share_rolls'
			]),
			toHit: {
				get() {
					let hit = (this.targeted.length > 1) ? false : true;
					return (this.setToHit !== undefined) ? this.setToHit : hit;
				},
				set(newValue) {
					this.setToHit = newValue;
					return newValue;
				}
			}
		},
		watch: {
			targeted(newValue) {
				if(newValue.length > 1) {
					this.toHit = false;
				} else {
					this.toHit = true;
				}
			},
			animateTrigger() {
				this.animateValue("toHitRoll", 0, this.rolledToHit, 500);
				this.animateValue("damageRoll", 0, this.rolledDamage, 500);
				this.rolledDamage = 0;
				this.rolledToHit = 0;
			}
		},
		created() {
			this.$nextTick(function() {
				window.addEventListener('keyup', this.checkKeyPress);
				window.addEventListener('keydown', this.checkKeyPress);
			});
		},
		destroyed() {
			window.removeEventListener('keyup', this.checkKeypress);
			window.removeEventListener('keydown', this.checkKeypress);
		},
		methods: {
			...mapActions([
				'setSlide',
				'setShareRolls',
			]),
			displayStats(entity) {
				var stats;
				if(entity.transformed == true) {
					stats = {
						ac: entity.transformedAc,
						maxHp: entity.transformedMaxHp,
						curHp: entity.transformedCurHp,
					}
				}
				else {
					stats = {
						ac: entity.ac,
						maxHp: entity.maxHp,
						curHp: entity.curHp,
					}
				}
				return stats
			},
			setShow(type, index) {
				this.active_action = this.active_action === `${type}-${index}` ? undefined : `${type}-${index}`;
				// if(type === 'action') {
				// 	this.showAction = (this.showAction === index) ? undefined : index;
				// } else if(type === 'legendary') {
				// 	this.showLegendary = (this.showLegendary === index) ? undefined : index;
				// }
			},
			groupRoll(e, action) {
				for(let i in this.targeted) {
					let key = this.targeted[i];
					let target = this.entities[key];

					this.roll(e, action, target, i);
				}
				this.aoeRoll = undefined;
				this.custom_roll = { 
					name: 'Custom Roll',
					damage_dice: undefined, 
					damamge_bonus: undefined
				};
			},
			roll(e, action, target, rollCounter) {
				event.stopPropagation();
				var rolls = action.damage_dice.replace(/\s+/g, ''); //remove spaces
				rolls = rolls.split('+'); //seperate the rolls
				let crit = false;
				let critDouble = false;
				let critRoll = 1; //set to 2 on a crit
				let hits = '';
				var total = 0;
				var allDamageRolls = [];
				var critInfo = '';
				let advantage_object = (e.advantage_disadvantage) ? e.advantage_disadvantage : {};

				if(e.e.shiftKey) {
					advantage_object["advantage"] = true;
				} 
				if(e.e.ctrlKey) {
					advantage_object["disadvantage"] = true;
				}

				var ac = parseInt(this.displayStats(target).ac);

				//Add bonus AC if there is any
				if(target.ac_bonus) {
					ac = parseInt(target.ac_bonus) + ac;
				}

				let attack_bonus = action.attack_bonus || 0;
				let toHit;
				let adv = "";
				//If there is advantage/disadvantage set required properties
				if(Object.keys(advantage_object).length === 1) {	
					//Set advantage message for snotify
					let color = (Object.keys(advantage_object)[0] === 'advantage') ? 'green' : 'red'; 
					adv = `<small class="${color} advantage">${Object.keys(advantage_object)[0]}</small>`;	
				}

				if(this.toHit) {
					toHit = this.rollD(e.e, 20, 1, attack_bonus, `${action.name} to hit`, this.current.name, false, advantage_object);
				}

				//Roll the damage for all seperated rolls
				//Roll if it's the first roll and rollOnce = true
				//Roll if rollOnce is false
				if((rollCounter == 0 && this.rollOnce) || !this.rollOnce){
					//Check if it was a crit
					if(this.toHit && toHit.throws[0] === 20) {
						crit = true;
						if(this.criticalSettings['.value']) {
							critDouble = true;
						} else {
							critInfo = `<div><b class="red">Crit!</b> The damage dice were rolled twice.</div>`;
							critRoll = 2;
						}
					}

					
					for(const index in rolls) {
						let modifier = 0;
						const dice = rolls[index].split('d'); //split amount from type of dice [1]d[6]
						const diceCount = dice[0]*critRoll; //Roll the damage dice twice if it was a crit and critsettings are set to roll twice
						
						//For the last roll, include the damage modifier, this is just to show it in saved rolls
						if(parseInt(index)+1 === rolls.length) {
							modifier = action.damage_bonus;
						}
						
						const rolled = this.rollD(e.e, dice[1], diceCount, modifier, action.name, this.current.name); //roll the dice
						const damage = rolled.throwsTotal; //save damage without the damage bonus

						allDamageRolls.push(rolled.throws);
						total = parseInt(total) + parseInt(damage); //Add the rolls to the total damage
					}
					//Set the roll that needs to be used when rolling damage only once
					if(this.rollOnce) {
						this.aoeRoll = { 
							allDamageRolls,
							total
						}
					}
				} else {
					//Use the first roll if rollOnce = true
					allDamageRolls = this.aoeRoll.allDamageRolls;
					total = this.aoeRoll.total;
				}

				//If it was an open roll, save it, so it will be shared on the track encounter screen.
				if(!this.demo) {
					//If the damage is rolled once, show all targets with that roll
					//Otherwise show 1 target per roll
					let targets = (this.rollOnce && !this.toHit) ? this.targeted : [target.key];

					//Only roll if 
					//All rolls should be seperate (different damage or same damage and to hit)
					//All rolls are together (same damge, no to hit) and there was no roll before
					if(this.share_rolls && ((rollCounter == 0 && this.rollOnce) || !this.rollOnce || this.toHit)) {
						const toHitRoll = (this.toHit) ? toHit.throws[0] : 0;
						this.shareRoll(targets, toHitRoll, total, action.attack_bonus, action.damage_bonus);
					} else {
						db.ref(`encounters/${this.userId}/${this.campaignId}/${this.encounterId}/lastRoll`).set(false);
					}
				}
				//Check if it was a critical hit and rolled damage should be doubled, not be rolled twice
				if(critDouble) {
					//Form HTML for snotify
					critInfo = `<div><b class="red">Crit!</b> The rolled damage was doubled.<br/> (was ${total}, changed to ${parseInt(total*2)})</div>`;
					total = parseInt(total*2);
				}
				//Add the damage modifier
				if(action['damage_bonus']) {
					var bonus = '+'+action['damage_bonus']; //form HTML for snotify
					var totalDamage = parseInt(total) + parseInt(action['damage_bonus']); //Add it to the total damage
					var showTotal = '<span class="red" id="damageRoll">' + totalDamage + '</span>'; //form HTML for snotify
				}
				else {
					//If there was no modifier
					bonus = '';
					totalDamage = total;
					showTotal = '<span class="red" id="damageRoll">' + total + '</span>';
				}
				this.rolledDamage = totalDamage; //For animation

				if(this.toHit) {
					let toHitRoll = toHit.throws[0];

					//If the to hit roll is a 20, it is a critical hit
					if(toHitRoll === 20) {
						toHitRoll = '<span class="green">natural 20</span>'; //form HTML for snotify
					}
					//If the to hit roll is a 1, it is a critical fail
					else if(toHitRoll === 1) {
						toHitRoll = '<span class="red">natural 1</span>'; //form HTML fo snotify
					}
					//If the to hit is higher than or equal to target's AC, it hits
					let hitOrMiss = (toHit.total >= ac) ? '<span class="green">HIT!</span>' : '<span class="red">MISS!</span>';
					let ignoredRoll = (Object.keys(advantage_object).length === 1) ? `<span class="gray-hover">${toHit.ignored}</span>` : ``;

					this.rolledToHit = toHit.total; //For animation

					//Form HTML for snotify
					hits = `<div class="roll">
						${(adv) ? adv : ``}
						<div class="top">
							${ignoredRoll}
							${toHitRoll}${toHit.mod}
						</div>
						<h2 id="toHitRoll">${toHit.total}</h2>
						<div class="bottom">
							${hitOrMiss}
						</div>
					</div>`;		
				}

				//BUILD SNOTIFY POPUP
				this.$snotify.html(
					`<div class="snotifyToast__title">
						<div class="target">
							<div class="image" style="background-image: url(${target.img});"></div>
							<div class="ac">${target.ac}</div>
							<div class="name truncate">${target.name}</div>
						</div>
					</div>
					<div class="snotifyToast__body">
						<h2 class="title"><b>${action.name}</b></h2>
						<div class="display-rolls">
							${this.toHit ? hits : ''}
							<div class="roll">
								<div class="top">${total}${bonus}</div>
								<h2>${showTotal}</h2>
								<div class="bottom">damage</div>
							</div>
						</div>
						${critInfo}
					</div> `, {
					timeout: 0,
					closeOnClick: false,
					buttons: [
						{ 
							text: 'Hit', 
							action: (toast) => { 
								this.setHP({ 'damage': totalDamage }, target, this.current, { crit })
								this.$snotify.remove(toast.id); 
							}, 
							bold: false
						},
						{ 
							//Does half of the damage rounded down
							text: 'Half', 
							action: (toast) => { 
								this.setHP({ 'damage': Math.floor(totalDamage/2) }, target, this.current, { crit })
								this.$snotify.remove(toast.id); 
							}, 
							bold: false
						},
						{ 
							//Does double of the damage
							text: 'Double', 
							action: (toast) => { 
								this.setHP({ 'damage': parseInt(totalDamage*2) }, target, this.current, { crit })
								this.$snotify.remove(toast.id); 
							}, 
							bold: false
						},
						{ 
							text: 'Miss', 
							action: (toast) => { 
								this.$snotify.remove(toast.id); 
							}, 
							bold: false
						},
					]
				});
				this.animateTrigger = !this.animateTrigger;
			},
			shareRoll(targets, toHit, damage, hitMod, damageMod) {
				var showRoll = {
					targets,
					timestamp: Date.now()
				};

				//Show to hit roll
				if(this.toHit) {
					if (Object.values(this.rollOptions).includes('toHit')) {
						if(toHit === 20) {
							showRoll.crit = 20;
						} else if(toHit === 1) {
							showRoll.crit = 1;
						}
						showRoll.toHitTotal = parseInt(toHit) + parseInt(hitMod);

						//Show Modifier
						if(Object.values(this.rollOptions).includes('modifiers')) {
							showRoll.toHit = toHit;
							if(hitMod) {
								showRoll.hitMod = hitMod;
							}
						}
					}
				}

				//Show damage roll
				if (Object.values(this.rollOptions).includes('damage')) {
					showRoll.damageTotal = (damageMod) ? parseInt(damage) + parseInt(damageMod) : parseInt(damage);

					//Show Modifier
					if(Object.values(this.rollOptions).includes('modifiers')) {
						showRoll.damage = damage;
						if(damageMod) {
							showRoll.damageMod = damageMod;
						}
					}
				}
				db.ref(`encounters/${this.userId}/${this.campaignId}/${this.encounterId}/lastRoll`).set(showRoll)
			},
			animateValue(id, start, end, duration) {
				if (start === end) return;
				const range = end - start;
				let current = start;
				const increment = end > start? 1 : -1;
				const stepTime = Math.abs(Math.floor(duration / range));
				const obj = document.getElementById(id);
				const timer = setInterval(function() {
						current += increment;
						obj.innerHTML = current;
						if (current == end) {
								clearInterval(timer);
						}
				}, stepTime);
			}
		},
	}
</script>

<style lang="scss" scoped>
	.select {
		h2 {
			margin-bottom: 5px !important;
		}
	}
	.info {
		vertical-align: -7px;
	}
	.custom-roll {
		display: grid;
		grid-template-columns: 50px 1fr 50px max-content;
		grid-gap: 3px;

		.btn {
			height: 40px !important;
		}
		.span {
			grid-column: span 2;
		}

		.advantage:hover {
			.btn {
				background-color: $green;
			}
		}
		.disadvantage:hover {
			.btn {
				background-color:$red;
			}
		}
	}
	.action-type {
		margin-bottom: 10px;
		&:last-child {
			margin-bottom: 30px;
		}
		h4 {
			font-size: 16px;
		}
		ul.roll {
			padding: 0;
			list-style: none;
			margin-top: 5px;
			li {
				padding-left: 5px;
				margin-bottom: 2px;

				a {
					width: 100%;
					padding: 5px;

					&:hover {
						text-decoration: none;
					}

					i {
						margin-top: 3px;
					}
				}
				.btn {
					min-width: 60px;
				}
				.advantage:hover {
					.btn {
						background-color: $green;
					}
				}
				.disadvantage:hover {
					.btn {
						background-color:$red;
					}
				}
			}
		}
	}
	.setAdvantage {
		margin-top: 20px;

		.btn {
			width: 48%;
		}
	}
</style>