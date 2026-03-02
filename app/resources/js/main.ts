import SiteNav from './modules/nav.js';
import Accordion from './modules/accordion.js';

declare var Handlebars: any;
declare var myApp: any;

//Helper classes to HTML for styling of nojs version
const html = document.querySelector('html');
html!.classList.remove('no-js');
html!.classList.add('js');

//taken from http://youmightnotneedjquery.com/
function ready(fn) {
	'use strict';

	if (document.readyState !== 'loading') {
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

ready(function() {
	'use strict';
	console.log('DOM is ready!');

	// custom event for use in other scripts
	document.dispatchEvent(new Event('domReady'));

	//initialize site navigation
	const navElement = document.querySelector('header > nav');
	if (navElement) {
		const navigation = new SiteNav({
			element: navElement
		});

		const hamburger = document.querySelector('button.hamburger');
		if (hamburger) {
			hamburger.addEventListener('click', function() {
				hamburger.classList.toggle('is-active');
				if (navigation.nav) {
					navigation.nav.classList.toggle('is-visible');
				}
			});
		}
	}

	//example of using a handlebars template/partial
	Handlebars.registerPartial('myPartial', myApp.templates.myPartial);
	var template = myApp.templates.helloWorld;
	var html = template({
		'title': 'Example of markup generated via js using handlebars',
		'subtitle': 'This text comes from a hbs partial!'
	});

	var aside = document.querySelector('aside') || document.querySelector('.handlebars');

	if (aside) {
		aside.innerHTML = html;
	} else {
		console.log('aside not found!');
	}

	//initialize accordions
	document.querySelectorAll<HTMLDetailsElement>('.accordion').forEach((element: HTMLDetailsElement) => {
		new Accordion(element);
	});
});
