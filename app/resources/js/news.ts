declare var Swiper: any;

document.querySelectorAll<HTMLElement>('.news-item__slider').forEach((slider) => {
		const pagination = slider.querySelector<HTMLElement>('.swiper-pagination');
		const slideCount = slider.querySelectorAll('.swiper-slide').length;

		new Swiper(slider, {
			loop: slideCount > 1,
			a11y: { enabled: true },
			pagination: {
				el: pagination,
				clickable: true
			}
		});
});
