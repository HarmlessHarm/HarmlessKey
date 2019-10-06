<template>
    <div v-if="searchResults">
        <h3>Players</h3>

        <!-- PLAYERS -->
        <div class="players bg-gray mb-1" v-if="campaign.players">
            <div v-for="(player, key) in campaign.players" 
                :key="key"
                @click="add(key, 'player', players[key].character_name)" 
                v-b-tooltip.hover 
                :title="'Add ' + players[key].character_name">
                <div class="d-flex justify-content-left">
                <template v-if="checkPlayer(key) < 0">
                    <span v-if="players[key].avatar" class="img" :style="{ backgroundImage: 'url(\'' + players[key].avatar + '\')' }"></span>
                    <span v-else class="img"><img src="@/assets/_img/styles/player.svg" /></span>
                </template>
                </div>
            </div>

            <div v-if="campaign && campaign.players === undefined">
                <h3 class="red"><i class="fas fa-users"></i> No Players Yet</h3>
                <p>Add players to your campaign first.</p>
                <router-link :to="'/campaigns/' + campaignId" class="btn btn-block">Go to campaign</router-link>
            </div>
            <a v-else class="btn" @click="addAllPlayers()">Add all</a>
        </div>
        <p><small>Missing players? <router-link :to="'/campaigns/'+campaignId">Add them to your campaign first</router-link>.</small></p>
		<hr>

        <!-- MONSTERS -->
		<h3>NPC's</h3>

        <div class="d-flex justify-content-between">
            <div class="input-group mb-3">
                <input type="text" autocomplete="off" v-model="search" @keyup="searchNPC()" placeholder="Search NPC" class="form-control"/>
                <div class="input-group-append">
                    <button class="btn"><i class="fas fa-search"></i></button>
                </div>
            </div>
        </div>

        <span v-if="searching && searchResults" class="green" :class="{'red': Object.keys(searchResults).length === 0}">{{ Object.keys(searchResults).length }} monstetrs found</span>

        <b-table 
            class="table entities"
            :busy="loadingNpcs"
            :items="searchResults" 
            :fields="monsterFields"
            :per-page="15"
            :current-page="currentPage"
        >
            <template slot="index" slot-scope="data">
                {{ data.index + 1 }}
            </template>

            <template slot="name" slot-scope="data">
                <a @click="setSlide({show: true, type: 'ViewEntity', data: data.item })" :class="{ 'green': data.item.custom}">
                    {{ data.item.name }}
                </a>
            </template>

            <!-- ACTIONS -->
            <div slot="actions" slot-scope="data" class="p-0">
                <div class="monster-actions">
                    <b-form-input class="multi_nr" autocomplete="off" v-b-tooltip.hover title="Add multiple npc's at once" type="number" min="1" name="name" placeholder="1" v-model="to_add[data.item['.key']]" />
                    <a v-b-tooltip.hover title="Add with average HP" @click="multi_add(data.item['.key'], 'npc', data.item.name, data.item.custom)">
                        <i class="fas fa-plus"></i>
                    </a>
                    <a v-b-tooltip.hover title="Add and roll HP" @click="multi_add(data.item['.key'], 'npc', data.item.name, data.item.custom, true)">
                        <i class="fas fa-dice-d20"></i>
                    </a>
                </div>
            </div>

            <!-- LOADER -->
            <div slot="table-busy" class="loader">
                <span>Loading monsters....</span>
            </div>
        </b-table>
        <b-pagination v-if="!loadingNpcs && Object.keys(searchResults).length > 15" align="center" :total-rows="Object.keys(searchResults).length" v-model="currentPage" :per-page="15" />
    </div>
</template>

<script>
    import { db } from '@/firebase';
	import { mapActions, mapGetters } from 'vuex';
	
	import { dice } from '@/mixins/dice.js'
	import { attributes } from '@/mixins/attributes.js'

	export default {
		name: 'Entities',
		mixins: [attributes, dice],
		data() {
			return {
                campaignId: this.$route.params.campid,
                encounterId: this.$route.params.encid,
                user: this.$store.getters.getUser,
                currentPage: 1,
                loadingNpcs: true,
                search: '',
				searchResults: [],
				noResult: '',
				auto_npcs: [],
				viewNPC: [],
				slide: this.$store.getters.getSlide,
				searching: false,
                to_add: {},
				monsterTypes: [
					"aberration",
					"beast",
					"undead"
				],
				typeFilter: [],
				monsterFields: {
					'index': {
						label: '#'
					},
					name: {
						label: 'Name',
						sortable: true
					},
					type: {
						label: 'Type',
						sortable: true
					},
					challenge_rating: {
						label: 'CR',
						sortable: true
					},
					'actions': {
						label: ''
					}
				},
			} 
		},
		async mounted() {
			this.fetchEncounter({
				cid: this.campaignId, 
				eid: this.encounterId, 
			}),
			this.fetchCampaign({
				cid: this.campaignId, 
            })

			//GET NPCS
			var monsters = db.ref(`monsters`);
			monsters.on('value', async (snapshot) => {
				let monsters = snapshot.val();

				for(let key in monsters) {
					monsters[key]['.key'] = key;
					monsters[key].custom = false;
				}
				let custom = db.ref(`npcs/${this.user.uid}`);
				custom.on('value', async (snapshot) => {
					let customNpcs = snapshot.val();
					for(let key in customNpcs) {
						customNpcs[key].custom = true;
						customNpcs[key]['.key'] = key;
						monsters.push(customNpcs[key]);
					}
				});
				this.searchResults = Object.values(monsters);
				this.monsters = monsters;
				this.loadingNpcs = false;
			});
        },
        computed: {
			...mapGetters([
				'encounter',
				'campaign',
				'players',
				'npcs',
			]),
        },
		methods: {
			...mapActions([
				'fetchEncounter',
                'fetchCampaign',
                'setSlide'
			]),
			searchNPC() {
				this.searchResults = []
				this.searching = true
				for (var i in this.monsters) {
					var m = this.monsters[i]
					if (m.name.toLowerCase().includes(this.search.toLowerCase()) && this.search != '') {
						this.noResult = ''
						this.searchResults.push(m)
					}
				}
				if(this.searchResults == '' && this.search != '') {
					this.noResult = 'No results for "' + this.search + '"';
				}
				if(this.search == '') {
					this.searchResults = Object.values(this.monsters);
					this.searching = false
				}
			},
            multi_add(id,type,name,custom=false,rollHp=false) {
				if (!this.to_add[id]) {
					this.to_add[id] = 1
				}
				for (let i = 0; i < this.to_add[id]; i++ ) {
					this.add(id,type,name,custom,rollHp)
				}
				this.to_add[id] = 1
            },
            add(id, type, name, custom = false, rollHp = false) {
				var entity = {
					id: id,
					name: name,
					entityType: type,
					initiative: 0,
					active: true,
				}
				var HP = undefined;

				if(type == 'npc') {
					entity.active = true
					let last = -1
					let n = 0
					for (let i in this.encounter.entities) {
						let match = this.encounter.entities[i].name.match(/^([a-zA-Z\s]+)(\((\d+)\))*/)
						// let id = this.encounter.entities[i].id
						if (match[1].trim() == entity.name) {
							n++
							if (parseInt(match[3]) > last) {
								last = parseInt(match[3])
							}
						}
					}
					if (last > 0) {
						entity.name = `${entity.name} (${++last})`
					} else if (n > 0) {
						entity.name = `${entity.name} (${n})`
						
					}
					
					if(custom == false) {
						var npc_data = this.monsters[id];
						entity.npc = 'api'
						if(rollHp && npc_data.hit_dice) {
							let dice = npc_data.hit_dice.split('d');
							let mod = dice[0] * this.calcMod(npc_data.constitution)

							HP = this.rollD(dice[1], dice[0], mod)

							entity.curHp = HP.total
							entity.maxHp = HP.total
						}
						else {
							entity.curHp = npc_data.hit_points
							entity.maxHp = npc_data.hit_points
						}
						entity.ac = npc_data.armor_class
					}
					else {
						npc_data = this.npcs[id];
						entity.npc = 'custom'
						entity.ac = npc_data.ac

						if(rollHp && npc_data.hit_dice) {
							let dice = npc_data.hit_dice.split('d');
							let mod = dice[0] * this.calcMod(npc_data.constitution)

							HP = this.rollD(dice[1], dice[0], mod)
							
							entity.curHp = HP.total
							entity.maxHp = HP.total
						}
						else {
							entity.curHp = npc_data.maxHp
							entity.maxHp = npc_data.maxHp
						}
					}
					db.ref('encounters/' + this.user.uid + '/' + this.campaignId + '/' + this.encounterId + '/entities').push(entity);
				}
				else if (type == 'player') {
					db.ref('encounters/' + this.user.uid + '/' + this.campaignId + '/' + this.encounterId + '/entities').child(id).set(entity);
				}
				if(type == 'npc') {
					let notifyHP = [];

					if(HP) {
						notifyHP.total = HP.total
						notifyHP.throws = ' [' + HP.throws + '] '
						notifyHP.mod = HP.mod
					}
					else {
						notifyHP.total = entity.maxHp;
						notifyHP.throws = ''
						notifyHP.mod = ''
					}

					this.$snotify.success('HP: ' + notifyHP.total + notifyHP.throws + notifyHP.mod, 'NPC added', {
						position: "centerTop"
					});
				}
            },
			addAllPlayers() {
				for(let player in this.campaign.players) {
					let name = this.players[player].character_name;
					this.add(player, 'player', name)
				}
            },
			checkPlayer(id) {
				if(this.encounter.entities) {
					return (Object.keys(this.encounter.entities).indexOf(id))
				} else {
					return -1
				}
			},
		}
	}
</script>

<style lang="scss" scoped>
// Remove arrows from number field
input[type="number"]::-webkit-outer-spin-button, input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
.monster-actions {
	display: flex;
	justify-content: flex-end;
	
	a {
		line-height: 30px;
		height: 30px;
		margin-left: 15px;
	}
	.form-control {
		height: 30px;
	}
}

.players {
	display: flex;
	justify-content: flex-start;
	padding: 10px;

	.img {
		width: 38px;
		height: 38px;
		background-size: cover;
		background-position: center top;
		margin-right: 5px;
		background-color: #302f2f;
		cursor: pointer;
	}
}
.multi_nr {
	width: 45px;
	height: 30px;
	text-align: center;
	margin-left: 4px;
}
</style>