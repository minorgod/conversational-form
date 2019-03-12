import {IControlElementOptions, ControlElement, ControlElementEvents } from './ControlElement'
import { Tag } from '../../form-tags/Tag'


// interface

// class
export class Button extends ControlElement {

		public get type(): string {
			return 'Button'
		}
		private imgEl: HTMLImageElement
		private clickCallback: () => void
		private mouseDownCallback: () => void
		private imageLoadedCallback: () => void

		constructor(options: IControlElementOptions) {
			super(options)

			this.clickCallback = this.onClick.bind(this)
			this.el.addEventListener('click', this.clickCallback, false)

			this.mouseDownCallback = this.onMouseDown.bind(this)
			this.el.addEventListener('mousedown', this.mouseDownCallback, false)

			//image
			this.checkForImage()
		}

		public hasImage(): boolean {
			return (this.referenceTag as Tag).hasImage
		}

		public dealloc() {
			this.el.removeEventListener('click', this.clickCallback, false)
			this.clickCallback = null

			if(this.imageLoadedCallback) {
				this.imgEl.removeEventListener('load', this.imageLoadedCallback, false)
				this.imageLoadedCallback = null

			}

			this.el.removeEventListener('mousedown', this.mouseDownCallback, false)
			this.mouseDownCallback = null

			super.dealloc()
		}

		// override
		public getTemplate (): string {
			return `<cf-button class="cf-button">
				` + this.referenceTag.label + `
			</cf-button>
			`
		}

		protected onClick(event: MouseEvent) {
			this.onChoose()
		}

		/**
		* @name checkForImage
		* checks if element has cf-image, if it has then change UI
		*/
		private checkForImage(): void {
			const hasImage: boolean = this.hasImage()
			if(hasImage) {
				this.el.classList.add('has-image')
				this.imgEl = document.createElement('img') as HTMLImageElement
				this.imageLoadedCallback = this.onImageLoaded.bind(this)
				this.imgEl.classList.add('cf-image')
				this.imgEl.addEventListener('load', this.imageLoadedCallback, false)
				this.imgEl.src = this.referenceTag.domElement.getAttribute('cf-image')
				this.el.insertBefore(this.imgEl, this.el.children[0])
			}
		}

		private onImageLoaded() {
			this.imgEl.classList.add('loaded')
			this.eventTarget.dispatchEvent(new CustomEvent(ControlElementEvents.ON_LOADED, {}))
		}

		private onMouseDown(event: MouseEvent) {
			event.preventDefault()
		}
	}


