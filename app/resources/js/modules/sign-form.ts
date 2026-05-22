class SignForm {
	form: HTMLFormElement;
	defaultErrorText: string;
	errorMessage: HTMLElement | null;
	successMessage: HTMLElement | null;
	submitButton: HTMLButtonElement | null;

	constructor(form: HTMLFormElement) {
		this.form = form;
		this.errorMessage = document.querySelector('.form-message--error');
		this.defaultErrorText = this.errorMessage?.textContent || 'Sorry, your signature could not be sent right now. Please try again later.';
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
				this.showError(await response.text());
				return;
			}

			this.form.hidden = true;
			this.successMessage?.removeAttribute('hidden');
		} catch (error) {
			console.error('Failed to submit sign compass form:', error);
			this.showError();
		} finally {
			this.setLoading(false);
		}
	}

	hideMessages() {
		if (this.errorMessage) {
			this.errorMessage.textContent = this.defaultErrorText;
		}
		this.errorMessage?.setAttribute('hidden', '');
		this.successMessage?.setAttribute('hidden', '');
	}

	showError(message = this.defaultErrorText) {
		if (this.errorMessage) {
			this.errorMessage.textContent = message || this.defaultErrorText;
			this.errorMessage.removeAttribute('hidden');
		}
	}

	setLoading(isLoading: boolean) {
		if (!this.submitButton) {
			return;
		}

		this.submitButton.disabled = isLoading;
	}
}

export default SignForm;
