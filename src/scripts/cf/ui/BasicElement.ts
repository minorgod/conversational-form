import ConversationalForm from '../ConversationalForm'
import EventDispatcher from '../logic/EventDispatcher'


	// interface
export interface IBasicElementOptions {
		eventTarget: EventDispatcher
		cfReference?: ConversationalForm,
		// set a custom template
		customTemplate?: string
	}

export interface IBasicElement {
		el: HTMLElement
		// template, can be overwritten ...
		getTemplate(): string
		dealloc(): void
	}

	// class
export class BasicElement implements IBasicElement {

		public el: HTMLElement
		protected eventTarget: EventDispatcher
		protected cfReference: ConversationalForm
		// optional value, but this can be used to overwrite the UI of Conversational Interface
		protected customTemplate: string

		constructor(options: IBasicElementOptions) {
			this.eventTarget = options.eventTarget
			this.cfReference = options.cfReference

			if(options.customTemplate) {
				this.customTemplate = options.customTemplate
			}

			// TODO: remove
			if(!this.eventTarget) {
				throw new Error('this.eventTarget not set!! : ' + (this.constructor as any).name)
			}

			this.setData(options)
			this.createElement()
			this.onElementCreated()
		}

		// template, should be overwritten ...
		public getTemplate (): string {return this.customTemplate || 'should be overwritten...'}
		public dealloc() {
			this.el.parentNode.removeChild(this.el)
		}

		protected setData(options: IBasicElementOptions) {
		
		}

		protected onElementCreated() {
		
		}

		private createElement(): Element {
			const template: HTMLTemplateElement = document.createElement('template')
			template.innerHTML = this.getTemplate()
			this.el = template.firstChild as HTMLElement || template.content.firstChild as HTMLElement
			return this.el
		}
	}

