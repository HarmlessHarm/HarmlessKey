import Vue from 'vue';
import Vuex from 'vuex';
import { auth } from '@/firebase';
import { general_module } from '@/store/modules/general';
import { tips_module } from '@/store/modules/tips';
import { encounter_module } from '@/store/modules/encounter';
import { content_module } from '@/store/modules/content';
import { content_spells } from '@/store/modules/content/spells.js';

Vue.use(Vuex);

export const store = new Vuex.Store({
	state: {
		user: undefined
	},
	getters: {
		user: function( state ) { return state.user; },
	},
	actions: {
		setUser({ commit }) {
			commit('SET_USER', auth.currentUser);
		}
	},
	mutations: {
		SET_USER(state, payload) { state.user = payload; },
	},
	modules: {
		general: general_module,
		content: content_module,
		encounter: encounter_module,
		spells: content_spells,
		tips: tips_module
	}
});