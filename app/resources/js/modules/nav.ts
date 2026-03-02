interface Navigation {
	maxHeight: number;
	nav: HTMLElement;
}

class Navigation {
	constructor(options) {
		this.maxHeight = 0;
		this.nav = options.element;

		let self = this;

		if (this.nav.getAttribute('data-set-max-height')) {
			this.nav.style.maxHeight = '0';

			const observer = new MutationObserver(function () {
				self.update();
			});

			observer.observe(self.nav, {
				attributes: true,
				attributeFilter: ['class'],
				childList: true,
				characterData: false,
				subtree: true
			});
		}

		const dropdowns = this.nav.querySelectorAll('.has-list');
		if (dropdowns) {
			self.initDropdown(dropdowns);
		}
	}

	initDropdown(dropdowns: NodeListOf<Element>) {
		const mediaQuery = window.matchMedia('(max-width: 767px)');

		dropdowns.forEach(dropdown => {
			dropdown.addEventListener('click', (event) => {
				const navItem = event.target!.closest('li');
				if (!mediaQuery.matches) {
					const otherNavItems = [...navItem.parentNode.children].filter((child) => child !== navItem);
					otherNavItems.forEach((item) => {
						item.classList.remove('expanded');
					});
				}
				navItem.classList.toggle('expanded');
			});

			/* On mobile if we are on one of the sub pages parent should be expanded on page load */
			if (mediaQuery.matches) {
				if (dropdown.classList.contains('selected')) {
					dropdown.classList.add('expanded');
				}
			}
		});

		//Click outside dropdowns should close all expanded dropdowns
		document.addEventListener('click', (event) => {
			const expandedDropdowns: Element[] = [];
			dropdowns.forEach((dropdown) => {
				if (dropdown.classList.contains('expanded')) {
					expandedDropdowns.push(dropdown);
				}
			});

			if (expandedDropdowns.length > 0) {
				const clickIsOutsideNav = (event.target as HTMLElement).closest('nav') === null ? true : false;
				if (clickIsOutsideNav) {
					expandedDropdowns.forEach((dropdown) => {
						dropdown.classList.remove('expanded');
					});
				}
			}
		});
	}

	getHeight() {
		let h;
		let maxHeight = this.nav.style.maxHeight;

		this.nav.style.maxHeight = 'none';
		h = this.nav.offsetHeight;
		this.nav.style.maxHeight = maxHeight;

		return h;
	}

	update() {
		const self = this;
		if (this.nav.classList.contains('is-visible')) {
			//if (this.maxHeight === undefined) {
				this.maxHeight = this.getHeight();
			//}

			//wihtout setTimeout style change won't be animated
			setTimeout(function() {
				self.nav.style.maxHeight = self.maxHeight + 'px';
			}, 0);
		} else {
			this.nav.style.maxHeight = '0';
		}
	}
}

export default Navigation;
