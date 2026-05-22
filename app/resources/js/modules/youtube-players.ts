type YouTubePlayer = {
	pauseVideo: () => void;
};

type YouTubeStateChangeEvent = {
	data: number;
	target: YouTubePlayer;
};

type YouTubeApi = {
	Player: new (element: HTMLIFrameElement, options: {
		events: {
			onStateChange: (event: YouTubeStateChangeEvent) => void;
		};
	}) => YouTubePlayer;
	PlayerState: {
		PLAYING: number;
	};
};

declare global {
	interface Window {
		YT?: YouTubeApi;
		onYouTubeIframeAPIReady?: () => void;
	}
}

export default class YouTubePlayers {
	private players: YouTubePlayer[] = [];
	private readonly iframes: HTMLIFrameElement[];

	constructor(selector = '.cards--youtube iframe') {
		this.iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>(selector));

		if (this.iframes.length === 0) {
			return;
		}

		this.prepareIframes();
		this.loadApi();
	}

	private prepareIframes() {
		this.iframes.forEach((iframe) => {
			const src = iframe.getAttribute('src');

			if (!src) {
				return;
			}

			const url = new URL(src);
			url.searchParams.set('enablejsapi', '1');
			url.searchParams.set('playsinline', '1');
			iframe.src = url.toString();
		});
	}

	private loadApi() {
		const previousReady = window.onYouTubeIframeAPIReady;

		window.onYouTubeIframeAPIReady = () => {
			previousReady?.();
			this.createPlayers();
		};

		if (window.YT?.Player) {
			this.createPlayers();
			return;
		}

		if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://www.youtube.com/iframe_api';
		script.async = true;
		document.head.appendChild(script);
	}

	private createPlayers() {
		if (!window.YT?.Player || this.players.length > 0) {
			return;
		}

		this.players = this.iframes.map((iframe) => new window.YT!.Player(iframe, {
			events: {
				onStateChange: (event) => this.pauseOtherPlayers(event)
			}
		}));
	}

	private pauseOtherPlayers(event: YouTubeStateChangeEvent) {
		if (event.data !== window.YT?.PlayerState.PLAYING) {
			return;
		}

		this.players.forEach((player) => {
			if (player !== event.target) {
				player.pauseVideo();
			}
		});
	}
}
