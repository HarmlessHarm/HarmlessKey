import './firebase'
import Vue from 'vue';
import App from './App.vue';
import jQuery from 'jquery'
import VueFire from 'vuefire'
import firebaseui from 'firebaseui'
import VeeValidate from 'vee-validate';
import firebase from 'firebase';
import VueRouter from 'vue-router';
import { store } from './store/store';
import { routes } from './routes';
import Snotify, { SnotifyPosition } from 'vue-snotify'

const options = {
  toast: {
    position: SnotifyPosition.centerTop,
    showProgressBar: false
  }
}

Vue.use(Snotify, options)
Vue.use(VeeValidate);
Vue.use(VueFire);

//Bootstrap
global.$ = jQuery
global.jQuery = jQuery
let Bootstrap = require('bootstrap')
import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'

Vue.use(BootstrapVue);

// Set-up and use the Vue Router
// Pass in your routes and then
// Set the mode to use history
// removes # from the URL
Vue.use(VueRouter);

const router = new VueRouter({
  routes: routes,
  linkActiveClass: "active", // active class for non-exact links.
  linkExactActiveClass: "exact-active", // active class for *exact* links.
  mode: 'history'
});

// Check before each page load whether the page requires authentication/
// if it does check whether the user is signed into the web app or
// redirect to the sign-in page to enable them to sign-in
router.beforeEach((to, from, next) => {

  const currentUser = firebase.auth().currentUser;
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !currentUser) {
    next('/sign-in');
  } else if (requiresAuth && currentUser) {
    next();
  } else {
    next();
  }

});

// Wrap the vue instance in a Firebase onAuthStateChanged method
// This stops the execution of the navigation guard 'beforeEach'
// method until the Firebase initialization ends
firebase.auth().onAuthStateChanged(function (user) {

  new Vue({
    el: '#app',
    store: store,
    router: router,
    render: h => h(App)
  });

});