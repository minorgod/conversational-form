/* tslint:disable:prefer-for-of */

import {ControlElement, ControlElementEvents} from './ControlElement'
import {OptionButton, OptionButtonEvents, IOptionButtonOptions} from './OptionButton'
import EventDispatcher from '../../logic/EventDispatcher'
import {ITag} from '@/scripts/cf/form-tags/Tag'
import ConversationalForm from '../../ConversationalForm'
import { OptionTag } from '../../form-tags/OptionTag'
import { SelectTag } from '../../form-tags/SelectTag'

// interface

export interface IOptionsListOptions {
		context: HTMLElement
		eventTarget: EventDispatcher
		referenceTag: ITag
	}

	// class
	// builds x OptionsButton from the registered SelectTag
export class OptionsList {

		public get type(): string {
			return 'OptionsList'
		}

		public elements: OptionButton[]
		private eventTarget: EventDispatcher
		private context: HTMLElement
		private multiChoice: boolean
		private referenceTag: ITag
		private onOptionButtonClickCallback: () => void

		constructor(options: IOptionsListOptions) {
			this.context = options.context
			this.eventTarget = options.eventTarget
			this.referenceTag = options.referenceTag

			// check for multi choice select tag
			this.multiChoice = this.referenceTag.domElement.hasAttribute('multiple')
			
			this.onOptionButtonClickCallback = this.onOptionButtonClick.bind(this)
			this.eventTarget.addEventListener(OptionButtonEvents.CLICK, this.onOptionButtonClickCallback, false)

			this.createElements()
		}

		public getValue(): OptionButton[] {
			const arr: OptionButton[] = []
			for (let i = 0; i < this.elements.length; i++) {
				const element: OptionButton = this.elements[i] as OptionButton
				if(!this.multiChoice && element.selected) {
					arr.push(element)
					return arr
				} else if(this.multiChoice && element.selected) {
					arr.push(element)
				}
			}
			return arr
		}

		public dealloc() {
			this.eventTarget.removeEventListener(OptionButtonEvents.CLICK, this.onOptionButtonClickCallback, false)
			this.onOptionButtonClickCallback = null

			while(this.elements.length > 0) {
				this.elements.pop().dealloc()
			}
			this.elements = null
		}

		private onOptionButtonClick(event: CustomEvent) {
			// if mutiple... then dont remove selection on other buttons
			if(!this.multiChoice) {
				// only one is selectable at the time.

				for (let i = 0; i < this.elements.length; i++) {
					const element: OptionButton = this.elements[i] as OptionButton
					if(element !== event.detail) {
						element.selected = false
					} else {
						element.selected = true
					}
				}

				ConversationalForm.illustrateFlow(this, 'dispatch', ControlElementEvents.SUBMIT_VALUE, this.referenceTag)
				this.eventTarget.dispatchEvent(new CustomEvent(ControlElementEvents.SUBMIT_VALUE, {
					detail: event.detail as OptionButton
				}))
			} else {
				(event.detail as OptionButton).selected = !(event.detail as OptionButton).selected
			}
		}

		private createElements() {
			this.elements = []
			const optionTags: OptionTag[] = (this.referenceTag as SelectTag).optionTags
			for (let i = 0; i < optionTags.length; i++) {
				const tag: OptionTag = optionTags[i]

				const btn: OptionButton = new OptionButton({
					referenceTag: tag,
					isMultiChoice: (this.referenceTag as SelectTag).multipleChoice,
					eventTarget: this.eventTarget
				} as IOptionButtonOptions)

				this.elements.push(btn)

				this.context.appendChild(btn.el)
			}
		}
	}


