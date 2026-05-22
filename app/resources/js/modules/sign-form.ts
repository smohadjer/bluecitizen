class SignForm {
	form: HTMLFormElement;
	errorMessage: HTMLElement | null;
	successMessage: HTMLElement | null;
	submitButton: HTMLButtonElement | null;

	constructor(form: HTMLFormElement) {
		this.form = form;
		this.errorMessage = document.querySelector('.form-message--error');
		this.successMessage = document.querySelector('.form-message--success');
		this.submitButton = this.form.querySelector<HTMLButtonElement>('button[type="submit"]');

		this.form.addEventListener('submit', (event) => this.onSubmit(event));
	}

	async onSubmit(event: SubmitEvent) {
		event.preventDefault();
		this.hideMessages();

		if (!this.form.reportValidity()) {
			return;
		}

		this.setLoading(true);

		try {
			const response = await fetch(this.form.action, {
				method: this.form.method,
				body: new URLSearchParams(new FormData(this.form) as Iterable<[string, string]>),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}

			this.form.hidden = true;
			this.successMessage?.removeAttribute('hidden');
		} catch (error) {
			console.error('Failed to submit sign compass form:', error);
			this.errorMessage?.removeAttribute('hidden');
		} finally {
			this.setLoading(false);
		}
	}

	hideMessages() {
		this.errorMessage?.setAttribute('hidden', '');
		this.successMessage?.setAttribute('hidden', '');
	}

	setLoading(isLoading: boolean) {
		if (!this.submitButton) {
			return;
		}

		this.submitButton.disabled = isLoading;
		this.submitButton.textContent = isLoading ? 'Sending...' : 'Sign Compass';
	}
}

export default SignForm;
