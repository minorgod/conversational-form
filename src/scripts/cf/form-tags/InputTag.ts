import { Tag, TagEvents, ITagOptions } from './Tag'
import {FlowDTO} from '../logic/FlowManager'

	// interface

	// class
export class InputTag extends Tag {
		constructor(options: ITagOptions) {
			super(options)
			
			/* tslint:disable:no-empty */
			if(this.type === 'text') {

			} else if(this.type === 'email') {

			} else if(this.type === 'tel') {

			} else if(this.type === 'checkbox') {

			} else if(this.type === 'radio') {

			} else if(this.type === 'password') {

			} else if(this.type === 'file') {
				// check InputFileTag.ts
			}
			/* tslint:enable:no-empty */
		}

		public setTagValueAndIsValid(value: FlowDTO): boolean {
			if(this.type === 'checkbox') {
				// checkbox is always true..
				return true
			} else {
				return super.setTagValueAndIsValid(value)
			}
		}

		public dealloc() {
			super.dealloc()
		}

		protected findAndSetQuestions() {
			super.findAndSetQuestions()

			// special use cases for <input> tag add here...
		}

		protected findAndSetLabel() {
			super.findAndSetLabel()

			if(!this._label) {
				// special use cases for <input> tag add here...
			}
		}
	}


