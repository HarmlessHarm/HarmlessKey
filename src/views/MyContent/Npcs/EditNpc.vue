<template>
	<div v-if="overencumbered" class='container'>
		<OverEncumbered/>
	</div>
	<div v-else-if="npc && npc.old" class="deprecated">
		<h2 class="red">Deprecated NPC</h2>
	</div>
	<q-form 
		v-else-if="npc || $route.name == 'AddNPC'" 
		@submit="{ ($route.name === 'AddNPC') ? addNpc() : editNpc() }"
	>
		<div class="content">
			<div class="top">
				<div class="d-flex justify-content-start">
					<router-link class="back" to="/npcs"><i class="fas fa-chevron-left"/> Back</router-link>
					<a v-if="$route.name === 'AddNPC'" class="btn" @click="copy_dialog = true">
						<i class="fas fa-copy"></i>
						Copy existing NPC
					</a>
				</div>
				<div v-if="npc" class="d-none d-md-flex name">
					<b v-if="npc.name">{{ npc.name}}</b>
					<div class="img" v-if="npc.avatar" :style="{ backgroundImage: 'url(\'' + npc.avatar + '\')' }" />
				</div>
			</div>

			<div class="form">
				<BasicInfo v-model="npc" />

				<Senses v-model="npc" />

				<AbilityScores v-model="npc" />

				<Skills v-model="npc" />

				<Defenses v-model="npc" />

				<SpellCasting v-model="npc" />

				<Actions v-model="npc" />
			</div>

			<!-- HANDLING -->
			<div class="save">
				<div class="d-flex justify-content-start">
					<template v-if="unsaved_changes">
						<div  class="red unsaved_changes">
							<i class="fas fa-exclamation-triangle"></i> Unsaved changes
						</div>	
						<a class="btn bg-gray" @click="revert_changes()">Revert</a>
					</template>
				</div>
				<div>
					<router-link :to="`/npcs`" class="btn bg-gray mr-2">Cancel</router-link>
					<q-btn label="Save" type="submit" color="primary"/>
				</div>
			</div>

			<!-- COPY DIALOG -->
			<q-dialog v-model="copy_dialog">
				<hk-card header="Copy Existing NPC">
					<q-input 
						dark filled square dense
						label="Search NPC"
						type="text" 
						autocomplete="off" 
						v-model="search" 
						@keyup="searchNPC()"
						class="mb-3"
					>
						<template v-slot:append>
							<q-icon name="fas fa-search" size="xs" @click="searchNPC()" />
						</template>
					</q-input>
					<p v-if="noResult" class="red">{{ noResult }}</p>
					<q-list dark>
						<q-item v-for="(npc, index) in searchResults" :key="index">
							<q-item-section>
								{{ npc.name.capitalizeEach() }}
							</q-item-section>
							<q-item-section avatar>
								<a class="gray-hover" @click="copy(npc)">
								<i class="fas fa-copy blue"/>
								<q-tooltip anchor="top middle" self="center middle">
									Copy NPC
								</q-tooltip>
							</a>
							</q-item-section>
						</q-item>
					</q-list>
				</hk-card>
			</q-dialog>
		</div>
	</q-form>
</template>

<script>
	import OverEncumbered from '@/components/OverEncumbered.vue';
	import { db } from '@/firebase';
	import { mapActions, mapGetters } from 'vuex';
	import { general } from '@/mixins/general.js';
	import BasicInfo from '@/components/npcs/BasicInfo';
	import Senses from '@/components/npcs/Senses';
	import AbilityScores from '@/components/npcs/AbilityScores';
	import Skills from '@/components/npcs/Skills';
	import Defenses from '@/components/npcs/Defenses';
	import SpellCasting from '@/components/npcs/SpellCasting';
	import Actions from '@/components/npcs/Actions';

	export default {
		name: 'Npcs',
		mixins: [general],
		metaInfo: {
			title: 'NPC\'s'
		},
		components: {
			OverEncumbered,
			BasicInfo,
			Senses,
			AbilityScores,
			Skills,
			Defenses,
			SpellCasting,
			Actions,
		},
		data() {
			return {
				userId: this.$route.params.userid || this.$store.getters.user.uid,
				npcId: this.$route.params.id,
				npc: {},
				npc_copy: {},
				copy_dialog: false,
				unsaved_changes: false,
				search: '',
				searchResults: [],
				noResult: '',
				tabs: [
					{
						name: "advanced",
						label: "Advanced build",
					},
					{
						name: "quick",
						label: "Quick build",
					}
				]
			}
		},
		mounted() {
			var npcs_ref = db.ref(`monsters`);
			npcs_ref.on('value', async (snapshot) => {
				let npcs = snapshot.val();

				let custom = db.ref(`npcs/${this.userId}`);
				custom.on('value', async (snapshot) => {
					let customNpcs = snapshot.val();
					for(let key in customNpcs) {
						npcs.push(customNpcs[key]);
					}
				});
				this.npcs = npcs;
			});
		},
		firebase() {
			return {
				npc: {
					source: db.ref(`npcs/${this.userId}/${this.npcId}`),
					asObject: true,
					readyCallback: () => {
						this.npc_copy = JSON.stringify(this.npc);
						this.unsaved_changes = false;
					}
				},
			}
		},
		computed: {
			...mapGetters([
				'tier',
				'overencumbered',
			]),
		},
		watch: {
			npc: {
				deep: true,
				handler(newVal) {
					if (JSON.stringify(newVal) !== this.npc_copy) {
						this.unsaved_changes = true;
					} else {
						this.unsaved_changes = false;
					}
					
					// Capitalize name
					if (this.npc.name) {
						this.npc.name = this.npc.name.capitalizeEach();
					}
				},
			}
		},
		methods: {
			...mapActions([
				'fetchCampaign',
				'setSlide'
			]),
			isOwner() {
				if (this.$route.name == 'Edit Companion') {
					return false;
				} return true;
			},
			searchNPC() {
				this.searchResults = [];
				this.searching = true;
				for (var i in this.npcs) {
					var m = this.npcs[i]
					if (m.name.toLowerCase().includes(this.search.toLowerCase()) && this.search != '') {
						this.noResult = '';
						this.searchResults.push(m);
					}
				}
				if(this.searchResults == '' && this.search != '') {
					this.noResult = 'No results for "' + this.search + '"';
				}
			},
			copy(npc) {
				this.copy_dialog = false;

				// Remove unwanted data from the monster
				delete npc.metadata;

				this.npc = npc;

				// Clear search
				this.searchResults = [];
				this.search = '';
			},
			revert_changes() {
				this.npc = JSON.parse(this.npc_copy);
				this.unsaved_changes = false;
			},
			addNpc() {
				delete this.npc['.value'];
				delete this.npc['.key'];

				db.ref('npcs/' + this.userId).push(this.npc);
					
				this.$snotify.success('Monster Saved.', 'Critical hit!', {
					position: "rightTop"
				});

				this.unsaved_changes = false;

				// Capitalize before stringyfy so changes found isn't triggered
				this.npc.name = this.npc.name.capitalizeEach();
				this.npc_copy = JSON.stringify(this.npc);
			},
			editNpc() {
				delete this.npc['.key'];

				db.ref(`npcs/${this.userId}/${this.npcId}`).set(this.npc);
					
				this.$snotify.success('Monster Saved.', 'Critical hit!', {
					position: "rightTop"
				});

				this.unsaved_changes = false;

				// Capitalize before stringyfy so changes found isn't triggered
				this.npc.name = this.npc.name.capitalizeEach();
				this.npc_copy = JSON.stringify(this.npc);
			},
			setQuick(input) {
				if(input == 0) {
					this.quick = false
				}
				else {
					this.quick = true
				}
			}
		},
		beforeRouteLeave (to, from, next) {
			if (this.unsaved_changes) {
				this.$snotify.error('There are unsaved changes in the form.\n Would you like to continue?', 'Unsaved Changes', {
					buttons: [
					{ text: 'Leave', action: (toast) => { next(); this.$snotify.remove(toast.id); }, bold: false},
					{ text: 'Stay', action: (toast) => { next(false); this.$snotify.remove(toast.id); }, bold: true},
					]
				});
			} else {
				next()
			}
		}
	}
</script>

<style lang="scss" scoped>
.content {
	display: grid;
	height: calc(100vh - 50px) !important;
	grid-template-rows: 35px 1fr 60px;

	.top {
		display: flex;
		justify-content: space-between;
		border-bottom: solid 1px $gray-hover;

		.back {
			line-height: 35px;
			margin-right: 10px;
		}
		.name {
			user-select: none;
			justify-content: flex-end;
			line-height: 35px;

			.img {
				width: 31px;
				height: 31px;
				background-position: center top;
				background-size: cover;
				border: solid 1px $gray-hover;
				margin: 2px 0 2px 5px;
				border-radius: 50%;
			}
		}
	}
	.form {
		padding-top: 5px;
		overflow-x: hidden;
		overflow-y: scroll;

		&::-webkit-scrollbar {
			display: none;
			columns: 2;
		}
	}
	.save {
		display: flex;
		justify-content: space-between;
		padding-top: 20px;
		border-top: solid 1px $gray-hover;

		.unsaved_changes {
			margin: 0 10px 0 0;
			line-height: 40px;
		}
	}
}



</style>