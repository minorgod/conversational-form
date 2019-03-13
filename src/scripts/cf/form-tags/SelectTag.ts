import { Tag, ITagOptions, ITag } from './Tag'
import { OptionButton } from '../ui/control-elements/OptionButton'
import { OptionTag } from './OptionTag'
import { FlowDTO } from '../logic/FlowManager'
import cf from '@/scripts/cf/ConversationalForm'
// interface

	// class
export class SelectTag extends Tag {

		public optionTags: OptionTag[]
		private _values: string[]

		public get type (): string {
			return 'select'
		}

		public get name (): string {
			return this.domElement && this.domElement.hasAttribute('name') ? this.domElement.getAttribute('name') : this.optionTags[0].name
		}

		public get value (): string | string[] {
			return this._values
		}

		public get multipleChoice(): boolean {
			return this.domElement.hasAttribute('multiple')
		}

		constructor(options: ITagOptions) {
			super(options)

			// build the option tags
			this.optionTags = []
			const domOptionTags: HTMLCollectionOf<HTMLOptionElement> = this.domElement.getElementsByTagName('option') as any
			for (let i = 0; i < domOptionTags.length; i++) {
				const element: HTMLOptionElement = domOptionTags[i] as HTMLOptionElement
				const tag: OptionTag = Tag.createTag(element) as OptionTag

				if(tag) {
					this.optionTags.push(tag)
				} else {
					console.warn((this.constructor as any).name, 'option tag invalid:', tag)
				}
			}
		}

		public setTagValueAndIsValid(dto: FlowDTO): boolean {
			let isValid: boolean = false

			// select tag values are set via selected attribute on option tag
			const numberOptionButtonsVisible: OptionButton[] = []
			this._values = []

			if(dto.controlElements) {
				// TODO: Refactor this so it is less dependant on controlElements
				for (let i = 0; i < this.optionTags.length; i++) {
					const tag: OptionTag = this.optionTags[i] as OptionTag

					for (let j = 0; j < dto.controlElements.length; j++) {
						const controllerElement: OptionButton = dto.controlElements[j] as OptionButton
						if(controllerElement.referenceTag === tag) {
							// tag match found, so set value
							tag.selected = controllerElement.selected

							// check for minimum one selected
							if(!isValid && tag.selected) {
								isValid = true
							}

							if(tag.selected) {
								this._values.push(tag.value as string)
							}

							if(controllerElement.visible) {
								numberOptionButtonsVisible.push(controllerElement)
							}
						}
					}
				}
			} else {
				let wasSelected: boolean = false
				// for when we don't have any control elements, then we just try and map values
				for (let i = 0; i < this.optionTags.length; i++) {
					const tag: ITag = this.optionTags[i] as ITag
					const v1: string = tag.value.toString().toLowerCase()
					const v2: string = dto.text.toString().toLowerCase()
					//brute force checking...
					if(v1.indexOf(v2) !== -1 || v2.indexOf(v1) !== -1) {
						// check the original tag
						this._values.push(tag.value as string);
						(tag.domElement as HTMLInputElement).checked = true
						wasSelected = true
					}
				}

				isValid = wasSelected
			}

			// special case 1, only one optiontag visible from a filter
			if(!isValid && numberOptionButtonsVisible.length === 1) {
				const element: OptionButton = numberOptionButtonsVisible[0]
				const tag: OptionTag = this.optionTags[this.optionTags.indexOf(element.referenceTag as OptionTag)]
				element.selected = true
				tag.selected = true
				isValid = true

				if(tag.selected) {
					this._values.push(tag.value as string)
				}
			}

			return isValid
		}
	}


