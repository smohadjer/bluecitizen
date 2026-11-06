// Button that turns the background animations (3D scene, bubbles, light rays) on or off.
// On small screens it sits to the left of the hamburger button; on desktop it is fixed in
// the top right corner of the viewport. The choice is remembered. Without a saved choice,
// animations start off for visitors who prefer reduced motion.
const KEY = 'bc-animations';
const ON_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
const OFF_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';

function readSaved(): string | null {
	try {
		return localStorage.getItem(KEY);
	} catch (e) {
		return null;
	}
}

export default class AnimationToggle {
	private button: HTMLButtonElement;
	private html = document.documentElement;
	private desktop = window.matchMedia('(min-width: 1024px)');

	constructor() {
		const saved = readSaved();
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const on = saved ? saved === 'on' : !reduced;

		this.button = document.createElement('button');
		this.button.type = 'button';
		this.button.className = 'animation-toggle';
		this.button.setAttribute('aria-label', 'Background animations');
		this.button.addEventListener('click', () => this.set(!this.isOn(), true));
		this.place();
		const onChange = () => this.place();
		if (this.desktop.addEventListener) {
			this.desktop.addEventListener('change', onChange);
		} else {
			this.desktop.addListener(onChange);
		}
		this.set(on, false);
	}

	// small screens: left of the hamburger button; desktop: fixed in the top right corner of the viewport
	private place() {
		const hamburger = document.querySelector('header .hamburger');
		if (!this.desktop.matches && hamburger && hamburger.parentElement) {
			hamburger.parentElement.insertBefore(this.button, hamburger);
			this.button.classList.add('animation-toggle--header');
		} else {
			document.body.appendChild(this.button);
			this.button.classList.remove('animation-toggle--header');
		}
	}

	private isOn() {
		return !this.html.classList.contains('animations-off');
	}

	private set(on: boolean, save: boolean) {
		this.html.classList.toggle('animations-off', !on);
		this.button.setAttribute('aria-pressed', String(on));
		this.button.title = on ? 'Pause background animations' : 'Play background animations';
		this.button.innerHTML = on ? ON_ICON : OFF_ICON;
		if (save) {
			try {
				localStorage.setItem(KEY, on ? 'on' : 'off');
			} catch (e) {
				/* private mode: ignore */
			}
		}
		document.dispatchEvent(new Event('animationschange'));
	}
}
