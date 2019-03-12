import {UserTextInput} from './ui/inputs/UserTextInput'
import {ChatList} from './ui/chat/ChatList'
import FlowManager, { FlowDTO } from './logic/FlowManager'
import EventDispatcher from './logic/EventDispatcher'
import {ITag} from './form-tags/Tag'
import {CfRobotMessageTag} from './form-tags/CfRobotMessageTag'
import {TagGroup} from './form-tags/TagGroup'
import {InputTag} from './form-tags/InputTag'
import {SelectTag} from './form-tags/SelectTag'
import {ButtonTag} from './form-tags/ButtonTag'
import {Dictionary} from './data/Dictionary'
import {TagsParser} from './parsing/TagsParser'
import './interfaces/IUserInput'
import './interfaces/IUserInterfaceOptions'
import { IUserInput } from './interfaces/IUserInput'
import { IUserInterfaceOptions } from './interfaces/IUserInterfaceOptions'
//import InputTag = cf.InputTag;

interface Window { ConversationalForm: any }



// CUI options
export interface ConversationalFormOptions {
		// HTMLFormElement
		formEl: HTMLFormElement

		// context (HTMLElement) of where to append the ConversationalForm (see also cf-context attribute)
		context?: HTMLElement

		// pass in custom tags (when prevent the auto-instantiation of ConversationalForm)
		tags?: ITag[]

		// overwrite the default user Dictionary items
		dictionaryData?: Object

		// overwrite the default robot Dictionary items
		dictionaryRobot?: Object

		//base64 || image url // overwrite user image, without overwritting the user dictionary
		userImage?: string

		// base64 || image url // overwrite robot image, without overwritting the robot dictionary
		robotImage?: string

		// custom submit callback if button[type=submit] || form.submit() is not wanted..
		submitCallback?: () => void | HTMLButtonElement

		// can be set to false to allow for loading and packaging of Conversational Form styles within a larger project.
		loadExternalStyleSheet?: boolean

		// prevent auto appending of Conversational Form, append it yourself.
		preventAutoAppend?: boolean

		// start the form in your own time, {cf-instance}.start(), exclude cf-form from form tag, see examples: manual-start.html
		preventAutoStart?: boolean
		
		// prevents the initial auto focus on UserInput
		preventAutoFocus?: boolean

		// optional horizontal scroll accerlation value, 0-1
		scrollAccerlation?: number

		// allow for a global validation method, asyncronous, so a value can be validated through a server, call success || error
		flowStepCallback?: (dto: FlowDTO, success: () => void, error: () => void) => void

		// optional event dispatcher, has to be an instance of cf.EventDispatcher
		eventDispatcher?: EventDispatcher

		// optional, set microphone nput, future, add other custom inputs, ex. VR
		microphoneInput?: IUserInput

		// optional, hide ÜserInputField when radio, checkbox, select input is active
		hideUserInputOnNoneTextInput?: boolean

		// optional, parameters for the User Interface of Conversational Form, set here to show thinking dots or not, set delay time in-between robot responses
		userInterfaceOptions?: IUserInterfaceOptions

		// optional, Whenther to suppress console.log, default true
		suppressLog?: boolean

		// Prevent submit on Enter keypress: https://github.com/space10-community/conversational-form/issues/270
		preventSubmitOnEnter?: boolean
	}

	// CUI formless options
export interface ConversationalFormlessOptions {
		options: any
		tags: any
	}

export class ConversationalForm {
		public get createId(): string {
			if(!this._createId) {
				this._createId = new Date().getTime().toString()
			}

			return this._createId
		}
		public get eventTarget(): EventDispatcher {
			if(!this._eventTarget) {
				this._eventTarget = new EventDispatcher(this)
			}

			return this._eventTarget
		}

		public static animationsEnabled: boolean = true
		public static illustrateAppFlow: boolean = true
		public static suppressLog: boolean = true
		public static preventSubmitOnEnter: boolean = false

		// to illustrate the event flow of the app
		public static illustrateFlow(classRef: any, type: string, eventType: string, detail: any = null) {
			// ConversationalForm.illustrateFlow(this, "dispatch", FlowEvents.USER_INPUT_INVALID, event.detail);
			// ConversationalForm.illustrateFlow(this, "receive", event.type, event.detail);

			if(ConversationalForm.illustrateAppFlow) {
				const highlight: string = 'font-weight: 900; background: '+(type === 'receive' ? '#e6f3fe' : 'pink')+'; color: black; padding: 0px 5px;'
				if(!ConversationalForm.suppressLog) console.log('%c** event flow: %c' + eventType + '%c flow type: %c' + type + '%c from: %c'+(classRef.constructor as any).name, 'font-weight: 900;',highlight, 'font-weight: 400;', highlight, 'font-weight: 400;', highlight)
				if(detail) {
					if(!ConversationalForm.suppressLog) console.log('** event flow detail:', detail)
				}
			}
		}
		public static startTheConversation(data: ConversationalFormOptions | ConversationalFormlessOptions) {
			let isFormless: boolean = !!(data as any).formEl === false
			let formlessTags: any
			let constructorOptions: ConversationalFormOptions

			if(isFormless) {
				if(typeof data === 'string') {
					// Formless init w. string
					isFormless = true
					const json: any = JSON.parse(data)
					constructorOptions = (json as ConversationalFormlessOptions).options
					formlessTags = (json as ConversationalFormlessOptions).tags
				} else {
					// Formless init w. JSON object
					constructorOptions = (data as ConversationalFormlessOptions).options
					formlessTags = (data as ConversationalFormlessOptions).tags
				}

				// formless, so generate the pseudo tags
				const formEl: HTMLFormElement = cf.TagsParser.parseJSONIntoElements(formlessTags)
				constructorOptions.formEl = formEl
			} else {
				// keep it standard
				constructorOptions = data as ConversationalFormOptions
			}

			return new cf.ConversationalForm(constructorOptions)
		}

		public static autoStartTheConversation() {
			if(cf.ConversationalForm.hasAutoInstantiated) {
				return
			}

			// auto start the conversation
			let formElements: NodeListOf<Element> = document.querySelectorAll('form[cf-form]')

			// no form elements found, look for the old init attribute
			if(formElements.length === 0) {
				formElements = document.querySelectorAll('form[cf-form-element]')
			}

			const formContexts: NodeListOf<Element> = document.querySelectorAll('*[cf-context]')

			if(formElements && formElements.length > 0) {
				for (let i = 0; i < formElements.length; i++) {
					const form: HTMLFormElement = formElements[i] as HTMLFormElement
					const context: HTMLFormElement = formContexts[i] as HTMLFormElement
					cf.ConversationalForm.startTheConversation({
						formEl: form,
						context: context
					})
				}

				cf.ConversationalForm.hasAutoInstantiated = true
			}
		}

		private static hasAutoInstantiated: boolean = false
		public version: string = '0.9.90'

		public dictionary: Dictionary
		public el: HTMLElement
		public chatList: ChatList
		public uiOptions: IUserInterfaceOptions
		public preventSubmitOnEnter: boolean

		private cdnPath: string = 'https://cdn.jsdelivr.net/gh/space10-community/conversational-form@{version}/dist/'
		/**
		 * createId
		 * Id of the instance, to isolate events
		 */
		private _createId: string

		// instance specific event target
		private _eventTarget: EventDispatcher

		private context: HTMLElement
		private formEl: HTMLFormElement
		private submitCallback: (cf: ConversationalForm) => void | HTMLButtonElement
		private onUserAnswerClickedCallback: () => void
		private flowStepCallback: (dto: FlowDTO, success: () => void, error: () => void) => void
		private tags: Array<ITag | ITagGroup>
		private flowManager: FlowManager
		private isDevelopment: boolean = false
		private loadExternalStyleSheet: boolean = true
		private preventAutoAppend: boolean = false
		private preventAutoStart: boolean = false
		
		private userInput: UserTextInput
		private microphoneInputObj: IUserInput

		constructor(options: ConversationalFormOptions) {
			window.ConversationalForm = this

			this.cdnPath = this.cdnPath.split('{version}').join(this.version)

			if(typeof options.suppressLog === 'boolean') {
				ConversationalForm.suppressLog = options.suppressLog
			}

			if(typeof options.preventSubmitOnEnter === 'boolean') {
				this.preventSubmitOnEnter = options.preventSubmitOnEnter
			}

			if(!ConversationalForm.suppressLog) console.log('Conversational Form > version:', this.version)
			if(!ConversationalForm.suppressLog) console.log('Conversational Form > options:', options)

			window.ConversationalForm[this.createId] = this

			// possible to create your own event dispatcher, so you can tap into the events of the app
			if(options.eventDispatcher) {
				this._eventTarget = options.eventDispatcher as EventDispatcher
			}

			if(!this.eventTarget.cf) {
				this.eventTarget.cf = this
			}

			// set a general step validation callback
			if(options.flowStepCallback) {
				this.flowStepCallback = options.flowStepCallback
			}
			
			this.isDevelopment = ConversationalForm.illustrateAppFlow = !!document.getElementById('conversational-form-development')
			
			if(this.isDevelopment || options.loadExternalStyleSheet === false) {
				this.loadExternalStyleSheet = false
			}

			if(!isNaN(options.scrollAccerlation)) {
				ScrollController.accerlation = options.scrollAccerlation
			}
			
			this.preventAutoStart = options.preventAutoStart
			this.preventAutoAppend = options.preventAutoAppend

			if(!options.formEl) {
				throw new Error('Conversational Form error, the formEl needs to be defined.')
			}

			this.formEl = options.formEl
			this.formEl.setAttribute('cf-create-id', this.createId)

			if(options.hideUserInputOnNoneTextInput === true) {
				UserInputElement.hideUserInputOnNoneTextInput = true
			}

			// TODO: can be a string when added as formless..
			// this.validationCallback = eval(this.domElement.getAttribute("cf-validation"));
			this.submitCallback = options.submitCallback
			if(this.submitCallback && typeof this.submitCallback === 'string') {
				// a submit callback method added to json, so use eval to evaluate method
				this.submitCallback = eval(this.submitCallback)
			}

			if(this.formEl.getAttribute('cf-no-animation') === '') {
				ConversationalForm.animationsEnabled = false
			}

			if(options.preventAutoFocus || this.formEl.getAttribute('cf-prevent-autofocus') === '') {
				UserInputElement.preventAutoFocus = true
			}

			this.dictionary = new Dictionary({
				data: options.dictionaryData,
				robotData: options.dictionaryRobot,
				userImage: options.userImage,
				robotImage: options.robotImage,
			})

			this.context = options.context ? options.context : document.body
			this.tags = options.tags

			if(options.microphoneInput) {
				// validate the user ..... TODO....
				if(!options.microphoneInput.init || !options.microphoneInput.input) {
					console.warn('Conversational Form: microphoneInput is not correctly setup', options.microphoneInput)
					options.microphoneInput = null
				}
			}

			this.microphoneInputObj = options.microphoneInput
			
			// set the ui options
			this.uiOptions = Helpers.extendObject(UserInterfaceDefaultOptions, options.userInterfaceOptions || {})
			// console.log('this.uiOptions:', this.uiOptions);

			this.init()
		}

		public init(): ConversationalForm {
			
			if(this.loadExternalStyleSheet) {
				// not in development/examples, so inject production css
				const head: HTMLHeadElement = document.head || document.getElementsByTagName('head')[0]
				const style: HTMLStyleElement = document.createElement('link')
				const githubMasterUrl: string = this.cdnPath + 'conversational-form.min.css'
				style.type = 'text/css'
				style.media = 'all'
				style.setAttribute('rel', 'stylesheet')
				style.setAttribute('href', githubMasterUrl)
				head.appendChild(style)
			} else {
				// expect styles to be in the document
				this.isDevelopment = true
			}

			// set context position to relative, else we break out of the box
			const position: string = window.getComputedStyle(this.context).getPropertyValue('position').toLowerCase()
			if(['fixed', 'absolute', 'relative'].indexOf(position) === -1) {
				this.context.style.position = 'relative'
			}















			// if tags are not defined then we will try and build some tags our selves..
			if(!this.tags || this.tags.length === 0) {
				this.tags = []

				const fields: Array<HTMLInputElement | HTMLSelectElement | HTMLButtonElement> = [].slice.call(this.formEl.querySelectorAll('input, select, button, textarea, cf-robot-message'), 0)

				for (let i = 0; i < fields.length; i++) {
					const element = fields[i]
					if(Tag.isTagValid(element)) {
						// ignore hidden tags
						this.tags.push(Tag.createTag(element))
					}
				}
			} else {
				// tags are manually setup and passed as options.tags.
			}

			// remove invalid tags if they've sneaked in.. this could happen if tags are setup manually as we don't encurage to use static Tag.isTagValid
			const indexesToRemove: ITag[] = []
			for(let i = 0; i < this.tags.length; i++) {
				const element = this.tags[i]
				if(!element || !Tag.isTagValid(element.domElement)) {
					indexesToRemove.push(element)
				}
			}

			for (let i = 0; i < indexesToRemove.length; i++) {
				const tag: ITag = indexesToRemove[i]
				this.tags.splice(this.tags.indexOf(tag), 1)
			}

			if(!ConversationalForm.suppressLog && (!this.tags || this.tags.length === 0)) {
				console.warn('Conversational Form: No tags found or registered.')
			}

			//let's start the conversation
			this.tags = this.setupTagGroups(this.tags)
			this.setupUI()

			return this
		}

		/**
		* @name updateDictionaryValue
		* set a dictionary value at "runtime"
		*	id: string, id of the value to update
		*	type: string, "human" || "robot"
		*	value: string, value to be inserted
		*/
		public updateDictionaryValue(id: string, type: string, value: string) {
			Dictionary.set(id, type, value)

			if(['robot-image', 'user-image'].indexOf(id) !== -1) {
				this.chatList.updateThumbnail(id === 'robot-image', value)
			}
		}

		public getFormData(serialized: boolean = false): FormData | any {
			if(serialized) {
				const serialized: any = {}
				for(let i = 0; i < this.tags.length; i++) {
					const element = this.tags[i]
					if(element.value) {
						serialized[element.name || 'tag-' + i.toString()] = element.value
					}
				}

				return serialized
			} else {
				const formData: FormData = new FormData(this.formEl)
				return formData
			}
		}

		public addRobotChatResponse(response: string) {
			this.chatList.createResponse(true, null, response)
		}

		public addUserChatResponse(response: string) {
			// add a "fake" user response..
			this.chatList.createResponse(false, null, response)
		}

		public stop(optionalStoppingMessage: string = '') {
			this.flowManager.stop()
			if(optionalStoppingMessage !== '') {
				this.chatList.createResponse(true, null, optionalStoppingMessage)
			}
			
			this.userInput.onFlowStopped()
		}

		public start() {
			this.userInput.disabled = false
			if(!ConversationalForm.suppressLog) console.log('option, disabled 3', )
			this.userInput.visible = true

			this.flowManager.start()
		}

		public getTag(nameOrIndex: string | number): ITag {
			if(typeof nameOrIndex === 'number') {
				return this.tags[nameOrIndex]
			} else {
				// TODO: fix so you can get a tag by its name attribute
				return null
			}
		}

		/**
		* @name addTag
		* Add a tag to the conversation. This can be used to add tags at runtime
		* see examples/formless.html
		*/
		public addTags(tagsData: DataTag[], addAfterCurrentStep: boolean = true, atIndex: number = -1): void {
			let tags: Array<ITag | ITagGroup> = []

			for (let i = 0; i < tagsData.length; i++) {
				const tagData: DataTag = tagsData[i]
				
				if(tagData.tag === 'fieldset') {
					// group ..
					// const fieldSetChildren: Array<DataTag> = tagData.children;
					// parse group tag
					const groupTag: HTMLElement = TagsParser.parseGroupTag(tagData)
					
					for (let j = 0; j < groupTag.children.length; j++) {
						const tag: HTMLElement = groupTag.children[j] as HTMLElement
						if(Tag.isTagValid(tag)) {
							const tagElement: ITag = Tag.createTag(tag as HTMLInputElement | HTMLSelectElement | HTMLButtonElement)
							// add ref for group creation
							if(!tagElement.name) {
								tagElement.name = 'tag-ref-'+j.toString()
							}

							tags.push(tagElement)
						}
					}
				} else {
					const tag: HTMLElement | HTMLInputElement | HTMLSelectElement | HTMLButtonElement = tagData.tag === 'select' ? TagsParser.parseGroupTag(tagData) : TagsParser.parseTag(tagData)
					if(Tag.isTagValid(tag)) {
						const tagElement: ITag = Tag.createTag(tag as HTMLInputElement | HTMLSelectElement | HTMLButtonElement)
						tags.push(tagElement)
					}
				}
			}

			// map free roaming checkbox and radio tags into groups
			tags = this.setupTagGroups(tags)

			// add new tags to the flow
			this.tags = this.flowManager.addTags(tags, addAfterCurrentStep ? this.flowManager.getStep() + 1 : atIndex)
			//this.flowManager.startFrom ?
		}

		/**
		* @name remapTagsAndStartFrom
		* index: number, what index to start from
		* setCurrentTagValue: boolean, usually this method is called when wanting to loop or skip over questions, therefore it might be usefull to set the value of the current tag before changing index.
		* ignoreExistingTags: boolean, possible to ignore existing tags, to allow for the flow to just "happen"
		*/
		public remapTagsAndStartFrom(index: number = 0, setCurrentTagValue: boolean = false, ignoreExistingTags: boolean = false) {
			if(setCurrentTagValue) {
				this.chatList.setCurrentUserResponse(this.userInput.getFlowDTO())
			}
			// possibility to start the form flow over from {index}
			for(let i = 0; i < this.tags.length; i++) {
				const tag: ITag | ITagGroup = this.tags[i]
				tag.refresh()
			}

			this.flowManager.startFrom(index, ignoreExistingTags)
		}

		/**
		* @name focus
		* Sets focus on Conversational Form
		*/
		public focus() {
			if(this.userInput) {
				this.userInput.setFocusOnInput()
			}
		}

		public doSubmitForm() {
			this.el.classList.add('done')

			this.userInput.reset()

			if(this.submitCallback) {
				// remove should be called in the submitCallback
				this.submitCallback(this)
			} else {
				// this.formEl.submit();
				// doing classic .submit wont trigger onsubmit if that is present on form element
				// as described here: http://wayback.archive.org/web/20090323062817/http://blogs.vertigosoftware.com/snyholm/archive/2006/09/27/3788.aspx
				// so we mimic a click.
				const button: HTMLButtonElement = this.formEl.ownerDocument.createElement('button')
				button.style.display = 'none'
				button.type = 'submit'
				this.formEl.appendChild(button)
				button.click()
				this.formEl.removeChild(button)

				// remove conversational
				this.remove()
			}
		}

		public remove() {
			if(this.microphoneInputObj) {
				this.microphoneInputObj = null
			}

			if(this.onUserAnswerClickedCallback) {
				this.eventTarget.removeEventListener(ChatResponseEvents.USER_ANSWER_CLICKED, this.onUserAnswerClickedCallback, false)
				this.onUserAnswerClickedCallback = null
			}

			if(this.flowManager) {
				this.flowManager.dealloc()
			}
			if(this.userInput) {
				this.userInput.dealloc()
			}
			if(this.chatList) {
				this.chatList.dealloc()
			}

			this.dictionary = null
			this.flowManager = null
			this.userInput = null
			this.chatList = null
			this.context = null
			this.formEl = null
			this.tags = null

			this.submitCallback = null
			this.el.parentNode.removeChild(this.el)
			this.el = null

			window.ConversationalForm[this.createId] = null
		}

		private setupTagGroups(tags: ITag[]): Array<ITag | ITagGroup> {
			// make groups, from input tag[type=radio | type=checkbox]
			// groups are used to bind logic like radio-button or checkbox dependencies
			const groups: any = []
			for(let i = 0; i < tags.length; i++) {
				const tag: ITag = tags[i]
				if(tag.type === 'radio' || tag.type === 'checkbox') {
					if(!groups[tag.name]) {
						groups[tag.name] = []
					}

					groups[tag.name].push(tag)
				}
			}

			if(Object.keys(groups).length > 0) {
				for (const group in groups) {
					if(groups[group].length > 0) {
						// always build groupd when radio or checkbox

						// find the fieldset, if any..
						const isFieldsetValidForCF = (tag: HTMLElement): boolean =>tag && tag.tagName.toLowerCase() !== 'fieldset' && !tag.hasAttribute('cf-questions')

						let fieldset: HTMLElement = groups[group][0].domElement.parentNode
						if(fieldset && fieldset.tagName.toLowerCase() !== 'fieldset') {
							fieldset = fieldset.parentNode as HTMLElement
							if(isFieldsetValidForCF(fieldset)) {
								// not a valid fieldset, we only accept fieldsets that contain cf attr
								fieldset = null
							}
						}

						const tagGroup: TagGroup = new TagGroup({
							fieldset: fieldset as HTMLFieldSetElement, // <-- can be null
							elements: groups[group]
						})

						// remove the tags as they are now apart of a group
						for(let i = 0; i < groups[group].length; i++) {
							const tagToBeRemoved: InputTag = groups[group][i]
							if(i === 0) {// add the group at same index as the the first tag to be removed
								tags.splice(tags.indexOf(tagToBeRemoved), 1, tagGroup)
							} else {
								tags.splice(tags.indexOf(tagToBeRemoved), 1)
							}
						}
					}
				}
			}

			return tags
		}

		private setupUI() {
			// start the flow
			this.flowManager = new FlowManager({
				cfReference: this,
				flowStepCallback: this.flowStepCallback,
				eventTarget: this.eventTarget,
				tags: this.tags
			})

			this.el = document.createElement('div')
			this.el.id = 'conversational-form'
			this.el.className = 'conversational-form'

			if(ConversationalForm.animationsEnabled) {
				this.el.classList.add('conversational-form--enable-animation')
			}

			// add conversational form to context
			if(!this.preventAutoAppend) {
				this.context.appendChild(this.el)
			}
			
			//hide until stylesheet is rendered
			this.el.style.visibility = 'hidden'

			const innerWrap = document.createElement('div')
			innerWrap.className = 'conversational-form-inner'
			this.el.appendChild(innerWrap)

			// Conversational Form UI
			this.chatList = new ChatList({
				eventTarget: this.eventTarget,
				cfReference: this
			})

			innerWrap.appendChild(this.chatList.el)

			this.userInput = new UserTextInput({
				microphoneInputObj: this.microphoneInputObj,
				eventTarget: this.eventTarget,
				cfReference: this
			})

			this.chatList.addInput(this.userInput)

			innerWrap.appendChild(this.userInput.el)

			this.onUserAnswerClickedCallback = this.onUserAnswerClicked.bind(this)
			this.eventTarget.addEventListener(ChatResponseEvents.USER_ANSWER_CLICKED, this.onUserAnswerClickedCallback, false)

			this.el.classList.add('conversational-form--show')
			
			if(!this.preventAutoStart) {
				this.flowManager.start()
			}

			if(!this.tags || this.tags.length === 0) {
				// no tags, so just show the input
				this.userInput.visible = true
			}
		}

		/**
		* @name onUserAnswerClicked
		* on user ChatReponse clicked
		*/
		private onUserAnswerClicked(event: CustomEvent): void {
			const tag: ITag | ITagGroup = event.detail
			this.flowManager.editTag(tag)
		}
	}


if(document.readyState === 'complete') {
	// if document alread instantiated, usually this happens if Conversational Form is injected through JS
	setTimeout(() => cf.ConversationalForm.autoStartTheConversation(), 0)
} else {
	// await for when document is ready
	window.addEventListener('load', () => {
		cf.ConversationalForm.autoStartTheConversation()
	}, false)
}

export default ConversationalForm
