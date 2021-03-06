<template>
	<div>
		<h3 v-if="targeted.length === 0" class="red text-center">Select a target</h3>
		<template v-else>
			<q-checkbox dark v-model="crit" label="Critical hit" indeterminate-value="something-else" />

			<hk-dmg-type-select v-model="damage_type" placeholder="Damage type" clearable dense class="mb-2"/>

			<div class="manual">
				<q-input 
					dark filled square
					type="number" 
					v-model="manualAmount" 
					v-validate="'numeric'" 
					name="Manual Input" 
					min="0"
					class="manual-input"
					@keypress="submitManual($event)"
					autocomplete="off" 
				/>
				<button class="btn dmg bg-red" 
					:class="{disabled: errors.has('Manual Input') || manualAmount == ''}" 
					@click="setManual('damage')"
				>
					Attack
					<img src="@/assets/_img/styles/sword-break.png" />
					<q-tooltip anchor="center right" self="center left">
						Enter
					</q-tooltip>
				</button>
				<button class="btn heal bg-green" 
					:class="{disabled: errors.has('Manual Input') || manualAmount == ''}" 
					@click="setManual('healing')"
				>
					Heal
					<img src="@/assets/_img/styles/heal.png" />
					<q-tooltip anchor="center right" self="center left">
						Shift + Enter
					</q-tooltip>
				</button>
			</div>
			<p class="validate red" v-if="errors.has('Manual Input')">{{ errors.first('Manual Input') }}</p>
			
			<div class="select-amount" :class="{ 'has-defenses': damage_type }">
				<div>Target</div>
				<div v-if="damage_type">
					<q-icon :name="damage_type_icons[damage_type]" :class="damage_type"/>
					Defenses
				</div>
				<div>Multipliers</div>
				<div></div>
				<template v-for="key in targeted">
					<div class="name truncate" :key="`name-${key}`">
						{{ entities[key].name.capitalizeEach() }}
					</div>
					<div v-if="damage_type" class="defenses" :key="`defenses-${key}`">
						<div 
							v-for="({name}, defense_key) in defenses"
							:key="defense_key"
							class="option"
							@click.stop="setDefense(key, defense_key)"
							:class="[{active: resistances[key] === defense_key}, defense_key]"
						>
							<i class="fas fa-shield"></i>
							<span>{{ defense_key.capitalize() }}</span>
							<q-tooltip anchor="top middle" self="center middle">
								{{ name }}
							</q-tooltip>
						</div>
					</div>
					<div class="multipliers" :key="`multipliers-${key}`">
						<div
							v-for="{value, name, label} in multipliers"
							@click="setMultiplier(key, value)"
							class="multiplier"
							:class="{'bg-blue': multiplier[key] === value}"
							:key="value"
						>
							{{ name }}
							<q-tooltip anchor="top middle" self="center middle">
								{{ label }}
							</q-tooltip>
						</div>
					</div>
					<div class="value" :key="`value-${key}`">
						{{ calculateAmount(key) }}
					</div>
				</template>
			</div>
		</template>
	</div>
</template>

<script>
	import { mapGetters } from "vuex";
	import { setHP } from "@/mixins/HpManipulations.js";
	import { damage_types } from "@/mixins/damageTypes.js";

	export default {
		name: "Manual",
		mixins: [setHP, damage_types],
		props: ["current"],
		data() {
			return {
				userId: this.$store.getters.user ? this.$store.getters.user.uid : undefined,
				campaignId: this.$route.params.campid,
				encounterId: this.$route.params.encid,
				manualAmount: '',
				damage_type: undefined,
				crit: false,
				log: undefined,
				multiplierSetter: undefined,
				resistances: {},
				defenses: {
					v: { name: "Vulnerable", value: "damage_vulnerabilities" },
					r: { name: "Resistant", value: "damage_resistances" },
					i: { name: "Immune", value: "damage_immunities" }
				},
				multipliers: [
					{ value: .5, name: "½", label: "Half" },
					{ value: 1, name: "1", label: "Full" },
					{ value: 2, name: "2", label: "Double" }
				],
			}
		},
		computed: {
			...mapGetters([
				'entities',
				'targeted'
			]),
			multiplier: {
				get() {		
					let returnValue = {}
					for(const key of this.targeted) {
						returnValue[key] = 1;
					}
					return (this.multiplierSetter) ? this.multiplierSetter : returnValue;
				},
				set(newValue) {
					this.multiplierSetter = newValue;
				}
			}
		},
		watch: {
			targeted(newTargets) {

				// Add new targets to multiplier list
				for(const key of newTargets) {
					// By default set multiplier to 1
					if(!Object.keys(this.multiplier).includes(key)) {
						this.$set(this.multiplier, key, 1)
					}
					// Check the reistances of a target
					if(this.damage_type && !Object.keys(this.resistances).includes(key)) {
						this.checkDefenses(key);
					}
				}
				// Remove untargeted from multiplier list
				for(let key in this.multiplier) {
					if(!newTargets.includes(key)) {
						this.$delete(this.multiplier, key);
					}
				}
				// Remove untargeted from resistances list
				for(let key in this.resistances) {
					if(!newTargets.includes(key)) {
						this.$delete(this.resistances, key);
					}
				}
			},
			damage_type() {
				this.resistances = {};
				for(const target of this.targeted) {
					this.checkDefenses(target);
				}
			}
		},
		methods: {
			checkDefenses(target) {
				const entity = this.entities[target];
				for(const [key, defense] of Object.entries(this.defenses)) {
					if(entity[defense.value] && entity[defense.value].includes(this.damage_type)) {			
						this.$set(this.resistances, target, key);
					}
				}
			},
			setMultiplier(key, multiplier) {
				this.$set(this.multiplier, key, multiplier);
				this.$forceUpdate();
			},
			setDefense(target, defense) {
				if(this.resistances[target] === defense) this.$delete(this.resistances, target);
				else this.$set(this.resistances, target, defense);
				this.$forceUpdate();
			},
			submitManual(e) {
				if(e.key === 'Enter' && e.shiftKey) {
					this.setManual('healing');
				} else if(e.key === 'Enter') {
					this.setManual('damage');
				}
			},
			calculateAmount(target, type) {
				let value = this.manualAmount;
				value = value * this.multiplier[target];

				if((!type || type === "damage") && this.resistances[target]) {
					switch(this.resistances[target]) {
						case "v": value = value * 2; break
						case "r": value = value * .5; break
						case "i": value = value * 0; break
					}
				}
				return Math.floor(value);
			},
			setManual(type) {
				this.$validator.validateAll().then((result) => {
					if(result && this.manualAmount != '') {

						//Update HP
						for(let i in this.targeted) {
							let key = this.targeted[i];
							let amount = {};
							amount[type] = parseInt(this.manualAmount);

							amount[type] = this.calculateAmount(key, type);

							// Set config for HpManipulation and log
							const config = {
								crit: this.crit,
								ability: "manual input",
								log: true,
								actions: [
									{
										type,
										manual: true,
										rolls: [
											{
												damage_type: this.damage_type,
												value: amount[type]
											}
										]
									}
								]
							};

							this.setHP(amount, this.entities[key], this.current, config)
						}

						//Reset input fields
						this.manualAmount = '';
						this.damage_type = '';
						this.crit = false;
					}
				})
			},
		},
	}
</script>

<style lang="scss" scoped>
.manual {
	display:grid;
	grid-template-columns: 1fr 1fr;
	grid-template-rows: 40px 40px;
	grid-gap: 10px;
	grid-template-areas: 
	"input btn-dmg"
	"input btn-heal";
	margin-bottom: 30px;

	.heal {
		grid-area: btn-heal;
	}
	.dmg {
		grid-area: btn-dmg;
	}
	.dmg, .heal {
		text-align: left;
		position: relative;
		padding: 5px 35px 5px 8px;

		img {
			position: absolute;
			height: 25px;
			right: 8px;
		}
	}
}
.select-amount {
	display: grid;
	grid-auto-rows: 28px;
	grid-template-columns: 1fr repeat(2, max-content);
	row-gap: 2px;

	&.has-defenses {
		grid-template-columns: 1fr repeat(3, max-content);
	}

	.name {
		background: $gray-dark;
		padding: 5px;
	}
	.defenses {
		background: $gray-dark;
		display: grid;
		grid-template-columns: 18px 18px 18px auto;
		grid-column-gap: 5px;
		user-select: none;
		line-height: 28px;
		padding-right: 10px;

		.type {
			padding-left: 10px;
		}

		.option {
			cursor: pointer;
			position: relative;
			width: 18px;
			font-size: 18px;
			text-align: center;
			line-height: 28px;
			color: $gray-light;

			span {
				font-size: 12px;
				text-align: center;
				font-weight: bold;
				position: absolute;
				width: 18px;
				line-height: 28px;
				top: 0;
				left: 0;
				color: $gray-dark;
			}

			&.active {
				&.i, &.r { color: $green; }
				&.v { color: $red; }
				span {
					color: $white;
				}
			}
		}
	}
	.multipliers {
		display: flex;
		justify-content: flex-end;
		background: $gray-dark;

		.multiplier {
			padding: 0 8px;
			margin-left: 1px;
			line-height: 28px;
			background: $gray-hover;
			color: $white;
			user-select: none;
			cursor: pointer;
		}
	}
	.value {
		line-height: 28px;
		padding-left: 8px;
		text-align: right;
		font-weight: bold;
		font-size: 15px;
		color: $blue;
	}
}
</style>