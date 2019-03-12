import {BasicElement, IBasicElementOptions } from '../BasicElement'
import {Helpers} from '../../logic/Helpers'
import ConversationalForm from '../../ConversationalForm'
import {IUserInterfaceOptions} from '../../interfaces/IUserInterfaceOptions'
import { ChatList } from './ChatList';
import { ITag } from '../../form-tags/Tag';
import { FlowDTO } from '../../logic/FlowManager';


// interface
export interface IChatResponseOptions extends IBasicElementOptions {
		response: string
		image: string
		list: ChatList
		isRobotResponse: boolean
		tag: ITag
		container: HTMLElement
	}

export const ChatResponseEvents = {
		USER_ANSWER_CLICKED: 'cf-on-user-answer-clicked'
	}

	// class
export class ChatResponse extends BasicElement {

		public get tag(): ITag {
			return this._tag
		}

		public get added(): boolean {
			return !!this.el.parentNode.parentNode
		}

		public get disabled(): boolean {
			return this.el.classList.contains('disabled')
		}

		public set disabled(value: boolean) {
			if(value) {
				this.el.classList.add('disabled')
			} else {
				this.el.classList.remove('disabled')
			}
		}

		public set visible(value: boolean) {
			this.el.offsetWidth
			setTimeout(() => value ? this.el.classList.add('show') : this.el.classList.remove('show'), 100)
		}

		public get strippedSesponse(): string {
			const html = this.response
			// use browsers native way of stripping
			const div = document.createElement('div')
			div.innerHTML = html
			return div.textContent || div.innerText || ''
		}
		public static list: ChatList
		private static THINKING_MARKUP: string = "<p class='show'><thinking><span>.</span><span>.</span><span>.</span></thinking></p>"

		public isRobotResponse: boolean

		public response: string
		public originalResponse: string // keep track of original response with id pipings
		public parsedResponse: string
		
		private uiOptions: IUserInterfaceOptions
		private textEl: Element
		private image: string
		private container: HTMLElement
		private _tag: ITag
		private readyTimer: number = 0
		private responseLink: ChatResponse // robot reference from use
		private onReadyCallback: () => void

		private onClickCallback: () => void

		constructor(options: IChatResponseOptions) {
			super(options)
			this.container = options.container
			this.uiOptions = options.cfReference.uiOptions
			this._tag = options.tag
		}

		public whenReady(resolve: () => void) {
			this.onReadyCallback = resolve
		}

		public setValue(dto: FlowDTO = null) {
			if(!this.visible) {
				this.visible = true
			}

			const isThinking: boolean = this.el.hasAttribute('thinking')

			if(!dto) {
				this.setToThinking()
			} else {
				// same same
				this.response = this.originalResponse = dto.text
				
				this.processResponseAndSetText()

				if(this.responseLink && !this.isRobotResponse) {
					// call robot and update for binding values ->
					this.responseLink.processResponseAndSetText()
				}

				// check for if response type is file upload...
				if(dto && dto.controlElements && dto.controlElements[0]) {
					switch(dto.controlElements[0].type) {
						case 'UploadFileUI' :
							this.textEl.classList.add('file-icon')
							break
					}
				}

				if(!this.isRobotResponse && !this.onClickCallback) {
					// edit
					this.onClickCallback = this.onClick.bind(this)
					this.el.addEventListener(Helpers.getMouseEvent('click'), this.onClickCallback, false)
				}
			}
		}

		public show() {
			this.visible = true
			this.disabled = false
			if(!this.response) {
				this.setToThinking()
			} else {
				this.checkForEditMode()
			}
		}

		public updateThumbnail(src: string) {

			const thumbEl: HTMLElement = this.el.getElementsByTagName('thumb')[0] as HTMLElement

			if(src.indexOf('text:') === 0) {
				const thumbElSpan: HTMLElement = thumbEl.getElementsByTagName('span')[0] as HTMLElement
				thumbElSpan.innerHTML = src.split('text:')[1]
				thumbElSpan.setAttribute('length', src.length.toString())
			} else {
				this.image = src
				thumbEl.style.backgroundImage = 'url("' + this.image + '")'
			}
		}

		public setLinkToOtherReponse(response: ChatResponse) {
			// link reponse to another one, keeping the update circle complete.
			this.responseLink = response
		}

		public processResponseAndSetText() {
			if(!this.originalResponse) {
				return
			}

			let innerResponse: string = this.originalResponse
			
			if(this._tag && this._tag.type === 'password' && !this.isRobotResponse) {
				let newStr: string = ''
				for (let i = 0; i < innerResponse.length; i++) {
					newStr += '*'
				}

				innerResponse = newStr
			}

			if(this.responseLink && this.isRobotResponse) {
				// if robot, then check linked response for binding values
				
				// one way data binding values:
				innerResponse = innerResponse.split('{previous-answer}').join(this.responseLink.parsedResponse)

			}

			if(this.isRobotResponse) {
				// Piping, look through IDs, and map values to dynamics
				const reponses: ChatResponse[] = ChatResponse.list.getResponses()
				for (let i = 0; i < reponses.length; i++) {
					const response: ChatResponse = reponses[i]
					if(response !== this) {
						if(response.tag) {
							// check for id, standard
							if(response.tag.id) {
								innerResponse = innerResponse.split('{' + response.tag.id + '}').join(response.tag.value as string)
							}

							//fallback check for name
							if(response.tag.name) {
								innerResponse = innerResponse.split('{' + response.tag.name + '}').join(response.tag.value as string)
							}
						}
					}
				}

				// add more..
				// innerResponse = innerResponse.split("{...}").join(this.responseLink.parsedResponse);
			}

			// check if response contains an image as answer
			const responseContains: boolean = innerResponse.indexOf('contains-image') !== -1
			if(responseContains) {
				this.textEl.classList.add('contains-image')
			}

			// if(this.response !== innerResponse){
				// now set it
			if(this.isRobotResponse) {
					this.textEl.innerHTML = ''

					if(!this.uiOptions) this.uiOptions = this.cfReference.uiOptions // On edit uiOptions are empty, so this mitigates the problem. Not ideal.

					const robotInitResponseTime: number = this.uiOptions.robot.robotResponseTime
					if(robotInitResponseTime !== 0) {
						this.setToThinking()
					}

					// robot response, allow for && for multiple responses
					const chainedResponses: string[] = innerResponse.split('&&')
					for (let i = 0; i < chainedResponses.length; i++) {
						const str: string = chainedResponses[i] as string
						setTimeout(() => {
							this.tryClearThinking()

							this.textEl.innerHTML += '<p>' + str + '</p>'
							const p: NodeListOf<HTMLElement> = this.textEl.getElementsByTagName('p') as any
							p[p.length - 1].offsetWidth
							p[p.length - 1].classList.add('show')

							this.scrollTo()
						}, robotInitResponseTime + ((i + 1) * this.uiOptions.robot.chainedResponseTime))
					}

					this.readyTimer = setTimeout(() => {
						if(this.onReadyCallback) {
							this.onReadyCallback()
						}

						// reset, as it can be called again
						this.onReadyCallback = null

						if(this._tag && this._tag.skipUserInput === true) {
							setTimeout(() => {
								this._tag.flowManager.nextStep()
								this._tag.skipUserInput = false // to avoid nextStep being fired again as this would make the flow jump too far when editing a response
							},this.uiOptions.robot.chainedResponseTime)
						}

					}, robotInitResponseTime + (chainedResponses.length * this.uiOptions.robot.chainedResponseTime))
				} else {
					// user response, act normal
					this.tryClearThinking()

					this.textEl.innerHTML = '<p>' + innerResponse + '</p>'
					const p: NodeListOf<HTMLElement> = this.textEl.getElementsByTagName('p') as any
					p[p.length - 1].offsetWidth
					p[p.length - 1].classList.add('show')

					this.scrollTo()
				}

			this.parsedResponse = innerResponse
			// }

			// value set, so add element, if not added
			this.addSelf()

			// bounce
			this.textEl.removeAttribute('value-added')
			setTimeout(() => {
				this.textEl.setAttribute('value-added', '')
				this.el.classList.add('peak-thumb')
			}, 0)

			this.checkForEditMode()

			// update response
			// remove the double ampersands if present
			this.response = innerResponse.split('&&').join(' ')
		}
		
		public scrollTo() {
			const y: number = this.el.offsetTop
			const h: number = this.el.offsetHeight

			if(!this.container && this.el) this.container = this.el // On edit this.container is empty so this is a fix to reassign it. Not ideal, but...

			this.container.scrollTop = y + h + this.container.scrollTop
		}

		public dealloc() {
			clearTimeout(this.readyTimer)
			this.container = null
			this.uiOptions = null
			this.onReadyCallback = null

			if(this.onClickCallback) {
				this.el.removeEventListener(Helpers.getMouseEvent('click'), this.onClickCallback, false)
				this.onClickCallback = null
			}

			super.dealloc()
		}

		// template, can be overwritten ...
		public getTemplate (): string {
			return '<cf-chat-response class="' + (this.isRobotResponse ? 'robot' : 'user') + `">
				<thumb><span></span></thumb>
				<text></text>
			</cf-chat-response>`
		}

		protected setData(options: IChatResponseOptions): void {
			this.image = options.image
			this.response = this.originalResponse = options.response
			this.isRobotResponse = options.isRobotResponse
			
			super.setData(options)
		}
		protected onElementCreated() {
			this.textEl = this.el.getElementsByTagName('text')[0] as Element

			this.updateThumbnail(this.image)

			if(this.isRobotResponse || this.response !== null) {
				// Robot is pseudo thinking, can also be user -->
				// , but if addUserChatResponse is called from ConversationalForm, then the value is there, therefore skip ...
				setTimeout(() => {
					this.setValue({text: this.response} as FlowDTO)
				}, 0)
				//ConversationalForm.animationsEnabled ? Helpers.lerp(Math.random(), 500, 900) : 0);
			} else {
				if(this.cfReference.uiOptions.user.showThumb) {
					this.el.classList.add('peak-thumb')
				}
			}
		}

		private checkForEditMode() {
			if(!this.isRobotResponse && !this.el.hasAttribute('thinking')) {
				this.el.classList.add('can-edit')
				this.disabled = false
			}
		}

		private tryClearThinking() {
			if(this.el.hasAttribute('thinking')) {
				this.textEl.innerHTML = ''
				this.el.removeAttribute('thinking')
			}
		}

		private setToThinking() {
			const canShowThinking: boolean = (this.isRobotResponse && this.uiOptions.robot.robotResponseTime !== 0) || (!this.isRobotResponse && this.cfReference.uiOptions.user.showThinking && !this._tag.skipUserInput)
			if(canShowThinking) {
				this.textEl.innerHTML = ChatResponse.THINKING_MARKUP
				this.el.classList.remove('can-edit')
				this.el.setAttribute('thinking', '')
			}

			if(this.cfReference.uiOptions.user.showThinking || this.cfReference.uiOptions.user.showThumb) {
				this.addSelf()
			}
		}

		/**
		* @name addSelf
		* add one self to the chat list
		*/
		private addSelf(): void {
			if(this.el.parentNode !== this.container) {
				this.container.appendChild(this.el)
			}
		}

		/**
		* @name onClickCallback
		* click handler for el
		*/
		private onClick(event: MouseEvent): void {
			this.setToThinking()

			ConversationalForm.illustrateFlow(this, 'dispatch', ChatResponseEvents.USER_ANSWER_CLICKED, event)
			this.eventTarget.dispatchEvent(new CustomEvent(ChatResponseEvents.USER_ANSWER_CLICKED, {
				detail: this._tag
			}))
		}
	}
