import Vue from 'vue';
import Vuex from 'vuex';
import { auth } from '@/firebase';
import { general_module } from '@/store/modules/general';
import { encounter_module } from '@/store/modules/encounter';
import { content_module } from '@/store/modules/content';

Vue.use(Vuex);

export const store = new Vuex.Store({
	state: {
		user: {}
	},
	getters: {
		user: function( state ) { return state.user; },
	},
	actions: {
		setUser({ commit }) {
			commit('SET_USER');
		}
	},
	mutations: {
		SET_USER(state) { state.user = auth.currentUser; },
	},
	modules: {
		general: general_module,
		content: content_module,
		encounter: encounter_module,
	}
});