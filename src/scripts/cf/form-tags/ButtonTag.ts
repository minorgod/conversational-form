import { Tag, ITagOptions } from './Tag'


	// interface

	// class
export class ButtonTag extends Tag {
		constructor(options: ITagOptions) {
			super(options)

			if(this.domElement.getAttribute('type') === 'submit') {
			} else if(this.domElement.getAttribute('type') === 'button') {
				// this.onClick = eval(this.domElement.onclick);
			}
		}
	}


