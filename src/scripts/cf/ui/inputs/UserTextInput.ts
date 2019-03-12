import {BasicElement} from '../BasicElement'
import {ControlElements} from '../control-elements/ControlElements'
import {FlowDTO} from '../../logic/FlowManager'
import IUserInputElement from '../../interfaces/IUserInputElement'
import {UserInputElement, IUserInputOptions, UserInputEvents} from './UserInputElement'
import {UserInputSubmitButton, UserInputSubmitButtonEvents} from './UserInputSubmitButton'
import ConversationalForm from '../../ConversationalForm'
import { IUserInput } from '../../interfaces/IUserInput'
import { TagEvents, ITag } from '../../form-tags/Tag'
import { ControlElementEvents, IControlElement, ControlElementProgressStates } from '../control-elements/ControlElement'
import { Dictionary } from '../../data/Dictionary'
import { ITagGroup, TagGroup } from '../../form-tags/TagGroup'
import { InputTag } from '../../form-tags/InputTag'
import { UploadFileUI } from '../control-elements/UploadFileUI'
import { SelectTag } from '../../form-tags/SelectTag'


// interface

export interface InputKeyChangeDTO {
		dto: FlowDTO,
		keyCode: number,
		inputFieldActive: boolean
	}

	// class
export class UserTextInput extends UserInputElement implements IUserInputElement {
		public get active(): boolean {
			return this.inputElement === document.activeElement || this._active
		}

		public set disabled(value: boolean) {
			const hasChanged: boolean = this._disabled !== value
			if(!ConversationalForm.suppressLog) console.log('option hasChanged', value)
			
			if(hasChanged) {
				this._disabled = value
				if(value) {
					this.el.setAttribute('disabled', 'disabled')
					this.inputElement.blur()
				} else {
					this.setFocusOnInput()
					this.el.removeAttribute('disabled')
				}
			}
		}


		protected microphoneObj: IUserInput
		private inputElement: HTMLInputElement | HTMLTextAreaElement
		private submitButton: UserInputSubmitButton

		private onControlElementSubmitCallback: () => void
		private onSubmitButtonChangeStateCallback: () => void
		private onInputFocusCallback: () => void
		private onInputBlurCallback: () => void
		private readonly onOriginalTagChangedCallback: () => void
		private readonly onControlElementProgressChangeCallback: () => void
		private errorTimer: any = 0
		private initialInputHeight: number = 0
		private shiftIsDown: boolean = false
		private keyUpCallback: () => void
		private keyDownCallback: () => void

		private readonly controlElements: ControlElements

		//acts as a fallback for ex. shadow dom implementation
		private _active: boolean = false

		constructor(options: IUserInputOptions) {
			super(options)

			this.cfReference = options.cfReference
			this.eventTarget = options.eventTarget
			this.inputElement = this.el.getElementsByTagName('textarea')[0]

			this.onInputFocusCallback = this.onInputFocus.bind(this)
			this.onInputBlurCallback = this.onInputBlur.bind(this)
			this.inputElement.addEventListener('focus', this.onInputFocusCallback, false)
			this.inputElement.addEventListener('blur', this.onInputBlurCallback, false)

			//<cf-input-control-elements> is defined in the ChatList.ts
			this.controlElements = new ControlElements({
				el: this.el.getElementsByTagName('cf-input-control-elements')[0] as HTMLElement,
				cfReference: this.cfReference,
				infoEl: this.el.getElementsByTagName('cf-info')[0] as HTMLElement,
				eventTarget: this.eventTarget
			})

			// setup event listeners

			this.keyUpCallback = this.onKeyUp.bind(this)
			document.addEventListener('keyup', this.keyUpCallback, false)

			this.keyDownCallback = this.onKeyDown.bind(this)
			document.addEventListener('keydown', this.keyDownCallback, false)

			this.onOriginalTagChangedCallback = this.onOriginalTagChanged.bind(this)
			this.eventTarget.addEventListener(TagEvents.ORIGINAL_ELEMENT_CHANGED, this.onOriginalTagChangedCallback, false)

			this.onControlElementSubmitCallback = this.onControlElementSubmit.bind(this)
			this.eventTarget.addEventListener(ControlElementEvents.SUBMIT_VALUE, this.onControlElementSubmitCallback, false)

			this.onControlElementProgressChangeCallback = this.onControlElementProgressChange.bind(this)
			this.eventTarget.addEventListener(ControlElementEvents.PROGRESS_CHANGE, this.onControlElementProgressChangeCallback, false)

			this.onSubmitButtonChangeStateCallback = this.onSubmitButtonChangeState.bind(this)
			this.eventTarget.addEventListener(UserInputSubmitButtonEvents.CHANGE, this.onSubmitButtonChangeStateCallback, false)

			// this.eventTarget.addEventListener(ControlElementsEvents.ON_RESIZE, () => {}, false);

			this.submitButton = new UserInputSubmitButton({
				eventTarget: this.eventTarget
			})

			this.el.appendChild(this.submitButton.el)

			// setup microphone support, audio
			if(options.microphoneInputObj) {
				this.microphoneObj = options.microphoneInputObj
				if(this.microphoneObj && this.microphoneObj.init) {
					// init if init method is defined
					this.microphoneObj.init()
				}

				this.submitButton.addMicrophone(this.microphoneObj)
			}
		}

		public getInputValue(): string {
			const str: string = this.inputElement.value

			// Build-in way to handle XSS issues ->
			const div = document.createElement('div')
			div.appendChild(document.createTextNode(str))
			return div.innerHTML
		}

		public getFlowDTO(): FlowDTO {
			let value: FlowDTO// = this.inputElement.value;

			// check for values on control elements as they should overwrite the input value.
			if(this.controlElements && this.controlElements.active) {
				value = this.controlElements.getDTO() as FlowDTO
			} else {
				value = {
					text: this.getInputValue()
				} as FlowDTO
			}

			// add current tag to DTO if not set
			if(!value.tag) {
				value.tag = this.currentTag
			}

			value.input = this
			value.tag = this.currentTag

			return value
		}

		public reset() {
			if(this.controlElements) {
				this.controlElements.clearTagsAndReset()
			}
		}

		public deactivate(): void {
			super.deactivate()
			if(this.microphoneObj) {
				this.submitButton.active = false
			}
		}

		public reactivate(): void {
			super.reactivate()

			// called from microphone interface, check if active microphone, and set loading if yes
			if(this.microphoneObj && !this.submitButton.typing) {
				this.submitButton.loading = true
				// setting typing to false calls the externa interface, like Microphone
				this.submitButton.typing = false
				this.submitButton.active = true
			}
		}

		public onFlowStopped() {
			this.submitButton.loading = false
			if(this.submitButton.typing) {
				this.submitButton.typing = false
			}

			if(this.controlElements) {
				this.controlElements.clearTagsAndReset()
			}
			
			this.disabled = true
		}

		public setFocusOnInput() {
			if(!UserInputElement.preventAutoFocus && !this.el.classList.contains('hide-input')) {
				this.inputElement.focus()
			}
		}

		public dealloc() {
			this.inputElement.removeEventListener('blur', this.onInputBlurCallback, false)
			this.onInputBlurCallback = null

			this.inputElement.removeEventListener('focus', this.onInputFocusCallback, false)
			this.onInputFocusCallback = null

			document.removeEventListener('keydown', this.keyDownCallback, false)
			this.keyDownCallback = null

			document.removeEventListener('keyup', this.keyUpCallback, false)
			this.keyUpCallback = null

			this.eventTarget.removeEventListener(ControlElementEvents.SUBMIT_VALUE, this.onControlElementSubmitCallback, false)
			this.onControlElementSubmitCallback = null

			// remove submit button instance
			this.submitButton.el.removeEventListener(UserInputSubmitButtonEvents.CHANGE, this.onSubmitButtonChangeStateCallback, false)
			this.onSubmitButtonChangeStateCallback = null
			this.submitButton.dealloc()
			this.submitButton = null

			super.dealloc()
		}

		// override
		public getTemplate (): string {
			return this.customTemplate || '<cf-input>\n\t' +
				'<cf-info></cf-info>\n\t' +
				'<cf-list-button direction="prev">' +
				'</cf-list-button>\n\t' +
				'<cf-list-button direction="next">' +
				'</cf-list-button>\n\t' +
				'<cf-list>' +
				'</cf-list>\n\t' +
				'</cf-input-control-elements>' +
				'<textarea type="input" tabindex="1" rows="1"></textarea>\n' +
				'</cf-input>'

		}

		protected inputInvalid(event: CustomEvent) {
			ConversationalForm.illustrateFlow(this, 'receive', event.type, event.detail)
			const dto: FlowDTO = event.detail

			this.inputElement.setAttribute('data-value', this.inputElement.value)
			this.inputElement.value = ''

			this.el.setAttribute('error', '')
			this.disabled = true
			// cf-error
			this.inputElement.setAttribute('placeholder', dto.errorText || (this._currentTag ? this._currentTag.errorMessage : ''))
			clearTimeout(this.errorTimer)

			// remove loading class
			this.submitButton.loading = false

			this.errorTimer = setTimeout(() => {
				this.disabled = false
				if(!ConversationalForm.suppressLog) console.log('option, disabled 1', )
				this.el.removeAttribute('error')
				this.inputElement.value = this.inputElement.getAttribute('data-value')
				this.inputElement.setAttribute('data-value', '')
				this.setPlaceholder()
				this.setFocusOnInput()
				
				//TODO: reset submit button..
				this.submitButton.reset()

				if(this.controlElements) {
					this.controlElements.resetAfterErrorMessage()
				}

			}, UserInputElement.ERROR_TIME)

		}

		protected onFlowUpdate(event: CustomEvent) {
			super.onFlowUpdate(event)

			this.submitButton.loading = false
			if(this.submitButton.typing) {
				this.submitButton.typing = false
			}

			// animate input field in

			this.el.setAttribute('tag-type', this._currentTag.type)

			// replace textarea and visa versa
			this.checkForCorrectInputTag()

			// set input field to type password if the dom input field is that, covering up the input
			const isInputSpecificType: boolean = ['password', 'number', 'email'].indexOf(this._currentTag.type) !== -1
			this.inputElement.setAttribute('type', isInputSpecificType ? this._currentTag.type : 'input')

			clearTimeout(this.errorTimer)
			this.el.removeAttribute('error')
			this.inputElement.setAttribute('data-value', '')
			this.inputElement.value = ''

			this.submitButton.loading = false

			this.setPlaceholder()

			this.resetValue()

			this.setFocusOnInput()

			this.controlElements.reset()

			if(this._currentTag.type === 'group') {
				this.buildControlElements((this._currentTag as ITagGroup).elements)
			} else {
				this.buildControlElements([this._currentTag])
			}

			if(this._currentTag.type === 'text' || this._currentTag.type === 'email') {
				this.inputElement.value = this._currentTag.defaultValue.toString()
			}

			if(this._currentTag.skipUserInput === true) {
				this.el.classList.add('hide-input')
			} else {
				this.el.classList.remove('hide-input')
			}

			// Set rows attribute if present
			if ((this._currentTag as InputTag).rows && (this._currentTag as InputTag).rows > 1) {
				this.inputElement.setAttribute('rows', (this._currentTag as InputTag).rows.toString())
			}

			if(UserInputElement.hideUserInputOnNoneTextInput) {
				// toggle userinput hide
				if(this.controlElements.active) {
					this.el.classList.add('hide-input')
					// set focus on first control element
					this.controlElements.focusFrom('bottom')
				} else {
					this.el.classList.remove('hide-input')
				}
			}

			setTimeout(() => {
				this.onInputChange()
			}, 150)
		}

		protected windowFocus(event: Event) {
			super.windowFocus(event)
			this.setFocusOnInput()
		}

		protected onEnterOrSubmitButtonSubmit(event: CustomEvent = null) {
			const isControlElementsActiveAndUserInputHidden: boolean = this.controlElements.active && UserInputElement.hideUserInputOnNoneTextInput
			if((this.active || isControlElementsActiveAndUserInputHidden) && this.controlElements.highlighted) {
				// active input field and focus on control elements happens when a control element is highlighted
				this.controlElements.clickOnHighlighted()
			} else {
				if(!this._currentTag) {
					// happens when a form is empty, so just play along and submit response to chatlist..
					this.eventTarget.cf.addUserChatResponse(this.inputElement.value)
				} else {
					// we need to check if current tag is file
					if(this._currentTag.type === 'file' && event) {
						// trigger <input type="file" but only when it's from clicking button
						(this.controlElements.getElement(0) as UploadFileUI).triggerFileSelect()
					} else {
						// for groups, we expect that there is always a default value set
						this.doSubmit()
					}
				}
			}
		}

		/**
		* @name onOriginalTagChanged
		* on domElement from a Tag value changed..
		*/
		private onOriginalTagChanged(event: CustomEvent): void {
			if(this.currentTag === event.detail.tag) {
				this.onInputChange()
			}

			if(this.controlElements && this.controlElements.active) {
				this.controlElements.updateStateOnElementsFromTag(event.detail.tag)
			}
		}

		private onInputChange() {
			if(!this.active && !this.controlElements.active) {
				return
			}

			// safari likes to jump around with the scrollHeight value, let's keep it in check with an initial height.
			const oldHeight: number = Math.max(this.initialInputHeight, parseInt(this.inputElement.style.height, 10))
			this.inputElement.style.height = '0px'
			this.inputElement.style.height = (this.inputElement.scrollHeight === 0 ? oldHeight : this.inputElement.scrollHeight) + 'px'

			ConversationalForm.illustrateFlow(this, 'dispatch', UserInputEvents.HEIGHT_CHANGE)
			this.eventTarget.dispatchEvent(new CustomEvent(UserInputEvents.HEIGHT_CHANGE, {
				detail: this.inputElement.scrollHeight
			}))
		}

		private setPlaceholder() {
			if(this._currentTag) {
				if(this._currentTag.inputPlaceholder) {
					this.inputElement.setAttribute('placeholder', this._currentTag.inputPlaceholder)
				} else {
					this.inputElement.setAttribute('placeholder', this._currentTag.type === 'group' ? Dictionary.get('group-placeholder') : Dictionary.get('input-placeholder'))
				}
			} else {
				this.inputElement.setAttribute('placeholder', Dictionary.get('group-placeholder'))
			}
		}

		private checkForCorrectInputTag() {
			// handle password natively
			const currentType: string = this.inputElement.getAttribute('type')
			const isCurrentInputTypeTextAreaButNewTagPassword: boolean = this._currentTag.type === 'password' && currentType !=='password'
			const isCurrentInputTypeInputButNewTagNotPassword: boolean = this._currentTag.type !=='password' && currentType === 'password'
			const isCurrentInputTypeTextAreaButNewTagNumberOrEmail: boolean = (this._currentTag.type === 'email' && currentType !=='email') || (this._currentTag.type === 'number' && currentType !=='number')

			// remove focus and blur events, because we want to create a new element
			if(this.inputElement && (isCurrentInputTypeTextAreaButNewTagPassword || isCurrentInputTypeInputButNewTagNotPassword)) {
				this.inputElement.removeEventListener('focus', this.onInputFocusCallback, false)
				this.inputElement.removeEventListener('blur', this.onInputBlurCallback, false)
			}

			if(isCurrentInputTypeTextAreaButNewTagPassword || isCurrentInputTypeTextAreaButNewTagNumberOrEmail) {
				// change to input
				const input = document.createElement('input')
				Array.prototype.slice.call(this.inputElement.attributes).forEach((item: any) => {
					input.setAttribute(item.name, item.value)
				})
				input.setAttribute('autocomplete', 'new-password')
				this.inputElement.parentNode.replaceChild(input, this.inputElement)
				this.inputElement = input

				if(this._currentTag.type === 'number' || this._currentTag.type === 'email') {
					// if field is type number or email then add type to user input
					this.inputElement.type = this._currentTag.type
					input.setAttribute('type', this._currentTag.type)
				}
			} else if(isCurrentInputTypeInputButNewTagNotPassword) {
				// change to textarea
				const textarea = document.createElement('textarea')
				Array.prototype.slice.call(this.inputElement.attributes).forEach((item: any) => {
					textarea.setAttribute(item.name, item.value)
				})
				this.inputElement.parentNode.replaceChild(textarea, this.inputElement)
				this.inputElement = textarea
			}

			// add focus and blur events to newly created input element
			if(this.inputElement && (isCurrentInputTypeTextAreaButNewTagPassword || isCurrentInputTypeInputButNewTagNotPassword)) {
				this.inputElement.addEventListener('focus', this.onInputFocusCallback, false)
				this.inputElement.addEventListener('blur', this.onInputBlurCallback, false)
			}

			if(this.initialInputHeight === 0) {
				// initial height not set
				this.initialInputHeight = this.inputElement.offsetHeight
			}

			this.setFocusOnInput()
		}

		private onControlElementProgressChange(event: CustomEvent) {
			const status: string = event.detail
			this.disabled = status === ControlElementProgressStates.BUSY
			if(!ConversationalForm.suppressLog) console.log('option, disabled 2', )
		}

		private buildControlElements(tags: ITag[]) {
			this.controlElements.buildTags(tags)
		}

		private onControlElementSubmit(event: CustomEvent) {
			ConversationalForm.illustrateFlow(this, 'receive', event.type, event.detail)

			// when ex a RadioButton is clicked..
			const controlElement: IControlElement = event.detail as IControlElement

			this.controlElements.updateStateOnElements(controlElement)

			this.doSubmit()
		}

		private onSubmitButtonChangeState(event: CustomEvent) {
			this.onEnterOrSubmitButtonSubmit(event)
		}

		private isMetaKeyPressed(event: KeyboardEvent): boolean {
			// if any meta keys, then ignore, getModifierState, but safari does not support..
			if(event.metaKey || [91, 93].indexOf(event.keyCode) !== -1) {
				return
			}
		}

		private onKeyDown(event: KeyboardEvent) {
			if(!this.active && !this.controlElements.focus) {
				return
			}
			
			if(this.isControlElementsActiveAndUserInputHidden()) {
				return
			}

			if(this.isMetaKeyPressed(event)) {
				return
			}

			// if any meta keys, then ignore
			if(event.keyCode === Dictionary.keyCodes['shift']) {
				this.shiftIsDown = true
			}

			// If submit is prevented by option 'preventSubmitOnEnter'
			if (this.cfReference.preventSubmitOnEnter === true && this.inputElement.hasAttribute('rows') && parseInt(this.inputElement.getAttribute('rows')) > 1) {
				return
			}

			// prevent textarea line breaks
			if(event.keyCode === Dictionary.keyCodes['enter'] && !event.shiftKey) {
				event.preventDefault()
			}
		}

		private isControlElementsActiveAndUserInputHidden(): boolean {
			return this.controlElements && this.controlElements.active && UserInputElement.hideUserInputOnNoneTextInput
		}

		private onKeyUp(event: KeyboardEvent) {
			if((!this.active && !this.isControlElementsActiveAndUserInputHidden()) && !this.controlElements.focus) {
				return
			}

			if(this.isMetaKeyPressed(event)) {
				return
			}

			if(event.keyCode === Dictionary.keyCodes['shift']) {
				this.shiftIsDown = false
			} else if(event.keyCode === Dictionary.keyCodes['up']) {
				event.preventDefault()

				if(this.active && !this.controlElements.focus) {
					this.controlElements.focusFrom('bottom')
				}
			} else if(event.keyCode === Dictionary.keyCodes['down']) {
				event.preventDefault()

				if(this.active && !this.controlElements.focus) {
					this.controlElements.focusFrom('top')
				}
			} else if(event.keyCode === Dictionary.keyCodes['tab']) {
				// tab key pressed, check if node is child of CF, if then then reset focus to input element

				let doesKeyTargetExistInCF: boolean = false
				let node = (event.target as HTMLElement).parentNode
				while (node !==null) {
					if (node === this.cfReference.el) {
						doesKeyTargetExistInCF = true
						break
					}

					node = node.parentNode
				}

				// prevent normal behaviour, we are not here to take part, we are here to take over!
				if(!doesKeyTargetExistInCF) {
					event.preventDefault()
					if(!this.controlElements.active) {
						this.setFocusOnInput()
					}
				}
			}

			if(this.el.hasAttribute('disabled')) {
				return
			}

			const value: FlowDTO = this.getFlowDTO()

			if((event.keyCode === Dictionary.keyCodes['enter'] && !event.shiftKey) || event.keyCode === Dictionary.keyCodes['space']) {
				if(event.keyCode === Dictionary.keyCodes['enter'] && this.active) {
					if (this.cfReference.preventSubmitOnEnter === true) return
					event.preventDefault()
					this.onEnterOrSubmitButtonSubmit()
				} else {
					// either click on submit button or do something with control elements
					if(event.keyCode === Dictionary.keyCodes['enter'] || event.keyCode === Dictionary.keyCodes['space']) {
						event.preventDefault()

						const tagType: string = this._currentTag.type === 'group' ? (this._currentTag as TagGroup).getGroupTagType() : this._currentTag.type

						if(tagType === 'select' || tagType === 'checkbox') {
							const mutiTag: SelectTag | InputTag = this._currentTag as SelectTag | InputTag
							// if select or checkbox then check for multi select item
							if(tagType === 'checkbox' || (mutiTag as SelectTag).multipleChoice) {
								if((this.active || this.isControlElementsActiveAndUserInputHidden()) && event.keyCode === Dictionary.keyCodes['enter']) {
									// click on UserTextInput submit button, only ENTER allowed
									this.submitButton.click()
								} else {
									// let UI know that we changed the key
									if(!this.active && !this.controlElements.active && !this.isControlElementsActiveAndUserInputHidden()) {
										// after ui has been selected we RESET the input/filter
										this.resetValue()
										this.setFocusOnInput()
									}

									this.dispatchKeyChange(value, event.keyCode)
								}
							} else {
								this.dispatchKeyChange(value, event.keyCode)
							}
						} else {
							if(this._currentTag.type === 'group') {
								// let the controlements handle action
								this.dispatchKeyChange(value, event.keyCode)
							}
						}
					} else if(event.keyCode === Dictionary.keyCodes['space'] && document.activeElement) {
						this.dispatchKeyChange(value, event.keyCode)
					}
				}
			} else if(event.keyCode !==Dictionary.keyCodes['shift'] && event.keyCode !==Dictionary.keyCodes['tab']) {
				this.dispatchKeyChange(value, event.keyCode)
			}

			this.onInputChange()
		}

		private dispatchKeyChange(dto: FlowDTO, keyCode: number) {
			// typing --->
			this.submitButton.typing = dto.text && dto.text.length > 0

			ConversationalForm.illustrateFlow(this, 'dispatch', UserInputEvents.KEY_CHANGE, dto)
			this.eventTarget.dispatchEvent(new CustomEvent(UserInputEvents.KEY_CHANGE, {
				detail: {
					dto: dto,
					keyCode: keyCode,
					inputFieldActive: this.active
				} as InputKeyChangeDTO
			}))
		}

		private onInputBlur(event: FocusEvent) {
			this._active = false
			this.eventTarget.dispatchEvent(new CustomEvent(UserInputEvents.BLUR))
		}

		private onInputFocus(event: FocusEvent) {
			this._active = true
			this.onInputChange()
			this.eventTarget.dispatchEvent(new CustomEvent(UserInputEvents.FOCUS))
		}

		private doSubmit() {
			const dto: FlowDTO = this.getFlowDTO()
			this.submitButton.loading = true

			this.disabled = true
			this.el.removeAttribute('error')
			this.inputElement.setAttribute('data-value', '')

			ConversationalForm.illustrateFlow(this, 'dispatch', UserInputEvents.SUBMIT, dto)
			this.eventTarget.dispatchEvent(new CustomEvent(UserInputEvents.SUBMIT, {
				detail: dto
			}))
		}

		private resetValue() {
			this.inputElement.value = ''
			if (this.inputElement.hasAttribute('rows')) this.inputElement.setAttribute('rows', '1')
			this.onInputChange()
		}
	}

