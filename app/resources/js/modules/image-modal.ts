type ImageModalItem = {
	alt: string;
	caption: string;
	src: string;
};

class ImageModal {
	dialog: HTMLDialogElement;
	images: ImageModalItem[];
	modalCaption: HTMLParagraphElement;
	modalImage: HTMLImageElement;
	currentImageIndex: number;

	constructor(selector = '.media-gallery__image') {
		const galleryImages = document.querySelectorAll<HTMLButtonElement>(selector);

		this.images = Array.from(galleryImages).map((button) => {
			const image = button.querySelector<HTMLImageElement>('img');
			const caption = button.closest('figure')?.querySelector('figcaption')?.textContent || '';

			return {
				alt: image?.alt || '',
				caption,
				src: image?.currentSrc || image?.src || ''
			};
		}).filter((image) => image.src);
		this.currentImageIndex = 0;

		this.dialog = document.createElement('dialog');
		this.dialog.className = 'image-modal';
		this.dialog.innerHTML = `
			<button class="image-modal__nav image-modal__nav--prev" type="button" aria-label="Previous image">‹</button>
			<img class="image-modal__image" src="" alt="" />
			<button class="image-modal__nav image-modal__nav--next" type="button" aria-label="Next image">›</button>
			<p class="image-modal__caption"></p>
		`;
		document.body.append(this.dialog);

		this.modalImage = this.dialog.querySelector<HTMLImageElement>('.image-modal__image')!;
		this.modalCaption = this.dialog.querySelector<HTMLParagraphElement>('.image-modal__caption')!;

		this.initEvents(galleryImages);
	}

	initEvents(galleryImages: NodeListOf<HTMLButtonElement>) {
		const prevButton = this.dialog.querySelector<HTMLButtonElement>('.image-modal__nav--prev')!;
		const nextButton = this.dialog.querySelector<HTMLButtonElement>('.image-modal__nav--next')!;

		galleryImages.forEach((button, index) => {
			button.addEventListener('click', () => {
				this.showImage(index);
				this.dialog.showModal();
			});
		});

		prevButton.addEventListener('click', (event) => {
			event.stopPropagation();
			this.showImage(this.currentImageIndex - 1);
		});
		nextButton.addEventListener('click', (event) => {
			event.stopPropagation();
			this.showImage(this.currentImageIndex + 1);
		});
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && this.dialog.open) {
				this.dialog.close();
			}
			if (event.key === 'ArrowLeft' && this.dialog.open) {
				this.showImage(this.currentImageIndex - 1);
			}
			if (event.key === 'ArrowRight' && this.dialog.open) {
				this.showImage(this.currentImageIndex + 1);
			}
		});
		this.dialog.addEventListener('click', (event) => {
			if (event.target === this.dialog) {
				this.dialog.close();
			}
		});
	}

	showImage(index: number) {
		this.currentImageIndex = (index + this.images.length) % this.images.length;
		const image = this.images[this.currentImageIndex];

		this.modalImage.src = image.src;
		this.modalImage.alt = image.alt;
		this.modalCaption.textContent = image.caption;
	}
}

export default ImageModal;
