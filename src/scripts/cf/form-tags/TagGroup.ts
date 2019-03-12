import {ButtonTag} from './ButtonTag'
import {InputTag} from './InputTag'
import {SelectTag} from './SelectTag'
import {UserTextInput} from '../ui/inputs/UserTextInput'
import { ITag } from './Tag'
import FlowManager, { FlowDTO } from '../logic/FlowManager'
import EventDispatcher from '../logic/EventDispatcher'
import { Dictionary } from '../data/Dictionary'
import ConversationalForm from '../ConversationalForm'
import { Helpers } from '../logic/Helpers'
import { RadioButton } from '../ui/control-elements/RadioButton'
import { CheckboxButton } from '../ui/control-elements/CheckboxButton'

// group tags together, this is done automatically by looking through InputTags with type radio or checkbox and same name attribute.
// single choice logic for Radio Button, <input type="radio", where name is the same
// multi choice logic for Checkboxes, <input type="checkbox", where name is the same



	// interface
export interface ITagGroupOptions {
		elements: ITag[]
		fieldset?: HTMLFieldSetElement
	}

export interface ITagGroup extends ITag {
		elements: ITag[]
		activeElements: ITag[]
		getGroupTagType: () => string
		required: boolean
		disabled: boolean
		skipUserInput: boolean
		flowManager: FlowManager
		inputPlaceholder?: string
		refresh(): void
		dealloc(): void
	}

	// class
export class TagGroup implements ITagGroup {
		
		public get required(): boolean {
			for (let i = 0; i < this.elements.length; i++) {
				const element: ITag = this.elements[i] as ITag
				if(this.elements[i].required) {
					return true
				}
			}

			return false
		}

		public set eventTarget(value: EventDispatcher) {
			this._eventTarget = value
			for (let i = 0; i < this.elements.length; i++) {
				const tag: ITag = this.elements[i] as ITag
				tag.eventTarget = value
			}
		}

		public set flowManager(value: FlowManager) {
			for (let i = 0; i < this.elements.length; i++) {
				const tag: ITag = this.elements[i] as ITag
				tag.flowManager = value
			}
		}

		public get type (): string {
			return 'group'
		}

		public get label (): string {
			return ''
		}

		public get name (): string {
			return this._fieldset && this._fieldset.hasAttribute('name') ? this._fieldset.getAttribute('name') : this.elements[0].name
		}

		public get id (): string {
			return this._fieldset && this._fieldset.id ? this._fieldset.id : this.elements[0].id
		}

		public get question(): string {
			// check if elements have the questions, else fallback
			if(this.questions && this.questions.length > 0) {
				return this.questions[Math.floor(Math.random() * this.questions.length)]
			} else if(this.elements[0] && this.elements[0].question) {
				const tagQuestion: string = this.elements[0].question
				return tagQuestion
			} else {
				// fallback to robot response from dictionary
				const robotReponse: string = Dictionary.getRobotResponse(this.getGroupTagType())
				return robotReponse
			}
		}

		public get activeElements (): ITag[] {
			return this._activeElements
		}

		public get value (): string[] {
			// TODO: fix value???
			return this._values ? this._values : ['']
		}

		public get disabled (): boolean {
			const disabled: boolean = false
			let allShouldBedisabled: number = 0
			for (let i = 0; i < this.elements.length; i++) {
				const element: ITag = this.elements[i] as ITag
				if(element.disabled) {
					allShouldBedisabled++
				}
			}

			return allShouldBedisabled === this.elements.length
		}
		
		public get errorMessage(): string {
			let errorMessage = Dictionary.get('input-placeholder-error')

			for (let i = 0; i < this.elements.length; i++) {
				const element: ITag = this.elements[i] as ITag
				errorMessage = element.errorMessage
			}

			return errorMessage
		}

		public get inputPlaceholder (): string {
			return this._inputPlaceholder
		}

		public skipUserInput: boolean

		// event target..
		public defaultValue: string // not getting set... as taggroup differs from tag
		public elements: ITag[]
		protected _inputPlaceholder: string

		private onInputKeyChangeCallback: () => void
		private _values: string[]
		private questions: string[] // can also be set through `fieldset` cf-questions="..."` attribute.
		
		/**
		* Array checked/choosen ITag's
		*/
		private _activeElements: ITag[]
		private _eventTarget: EventDispatcher
		private _fieldset: HTMLFieldSetElement

		constructor(options: ITagGroupOptions) {
			this.elements = options.elements
			// set wrapping element
			this._fieldset = options.fieldset
			if(this._fieldset && this._fieldset.getAttribute('cf-questions')) {
				this.questions = Helpers.getValuesOfBars(this._fieldset.getAttribute('cf-questions'))
			}
			if (this._fieldset && this._fieldset.getAttribute('cf-input-placeholder')) {
				this._inputPlaceholder = this._fieldset.getAttribute('cf-input-placeholder')
			}

			if(ConversationalForm.illustrateAppFlow) {
				if(!ConversationalForm.suppressLog) console.log('Conversational Form > TagGroup registered:', this.elements[0].type, this)
			}

			this.skipUserInput = false
		}

		public dealloc() {
			for (let i = 0; i < this.elements.length; i++) {
				const element: ITag = this.elements[i] as ITag
				element.dealloc()
			}

			this.elements = null
		}

		public refresh() {
			for (let i = 0; i < this.elements.length; i++) {
				const element: ITag = this.elements[i] as ITag
				element.refresh()
			}
		}

		public reset() {
			this._values = []
			for (let i = 0; i < this.elements.length; i++) {
				const element: ITag = this.elements[i] as ITag
				element.reset()
			}
		}

		public getGroupTagType(): string {
			return this.elements[0].type
		}

		public hasConditionsFor(tagName: string): boolean {
			for (let i = 0; i < this.elements.length; i++) {
				const element: ITag = this.elements[i] as ITag
				if(element.hasConditionsFor(tagName)) {
					return true
				}
			}

			return false
		}

		public hasConditions(): boolean {
			for (let i = 0; i < this.elements.length; i++) {
				const element: ITag = this.elements[i] as ITag
				if(element.hasConditions()) {
					return true
				}
			}

			return false
		}

		/**
		* @name checkConditionalAndIsValid
		* checks for conditional logic, see documentaiton (wiki)
		* here we check after cf-conditional{-name} on group tags
		*/
		public checkConditionalAndIsValid(): boolean {
			// can we tap into disabled
			// if contains attribute, cf-conditional{-name} then check for conditional value across tags
			for (let i = 0; i < this.elements.length; i++) {
				const element: ITag = this.elements[i] as ITag
				element.checkConditionalAndIsValid()
			}

			// else return true, as no conditional means happy tag
			return true
		}

		public setTagValueAndIsValid(dto: FlowDTO): boolean {
			let isValid: boolean = false

			const groupType: string = this.elements[0].type
			this._values = []
			this._activeElements = []

			switch(groupType) {
				case 'radio' :
					let wasRadioButtonChecked: boolean = false
					const numberRadioButtonsVisible: RadioButton[] = []
					if(dto.controlElements) {
						// TODO: Refactor this so it is less dependant on controlElements
						for (let i = 0; i < dto.controlElements.length; i++) {
							const element: RadioButton = dto.controlElements[i] as RadioButton
							const tag: ITag = this.elements[this.elements.indexOf(element.referenceTag)]
							numberRadioButtonsVisible.push(element)

							if(tag === element.referenceTag) {
								if(element.checked) {
									this._values.push(tag.value as string)
									this._activeElements.push(tag)
								}
								// a radio button was checked
								if(!wasRadioButtonChecked && element.checked) {
									wasRadioButtonChecked = true
								}
							}
						}

					} else {
						// for when we don't have any control elements, then we just try and map values
						for (let i = 0; i < this.elements.length; i++) {
							const tag: ITag = this.elements[i] as ITag
							const v1: string = tag.value.toString().toLowerCase()
							const v2: string = dto.text.toString().toLowerCase()
							//brute force checking...
							if(v1.indexOf(v2) !== -1 || v2.indexOf(v1) !== -1) {
								this._activeElements.push(tag)
								// check the original tag
								this._values.push(tag.value as string);
								(tag.domElement as HTMLInputElement).checked = true
								wasRadioButtonChecked = true
							}
						}
					}

					isValid = wasRadioButtonChecked
					break

				case 'checkbox' :
					// checkbox is always valid
					isValid = true

					if(dto.controlElements) {
						for (let i = 0; i < dto.controlElements.length; i++) {
							const element: CheckboxButton = dto.controlElements[i] as CheckboxButton
							const tag: ITag = this.elements[this.elements.indexOf(element.referenceTag)];
							(tag.domElement as HTMLInputElement).checked = element.checked

							if(element.checked) {
								this._values.push(tag.value as string)
								this._activeElements.push(tag)
							}
						}
					}

					if(this.required && this._activeElements.length === 0) {
						// checkbox can be required
						isValid = false
					}

					break
			}

			return isValid
		}
	}

