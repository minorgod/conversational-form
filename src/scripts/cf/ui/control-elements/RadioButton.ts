import {Button} from './Button'

	// interface

	// class
export class RadioButton extends Button {

		public get type(): string {
			return 'RadioButton'
		}

		public get checked(): boolean {
			const checked: boolean = this.el.hasAttribute('checked') && this.el.getAttribute('checked') === 'checked'
			return checked
		}

		public set checked(value: boolean) {
			if(!value) {
				this.el.removeAttribute('checked')
				this.referenceTag.domElement.removeAttribute('checked');
				(this.referenceTag.domElement as HTMLInputElement).checked = false
			} else {
				this.el.setAttribute('checked', 'checked')
				this.referenceTag.domElement.setAttribute('checked', 'checked');
				(this.referenceTag.domElement as HTMLInputElement).checked = true
			}
		}

		// override
		public getTemplate (): string {
			const isChecked: boolean = (this.referenceTag.domElement as HTMLInputElement).checked || this.referenceTag.domElement.hasAttribute('checked')
			return '<cf-radio-button class="cf-button" '+(isChecked ? 'checked=checked' : '')+'>' +
				'<div>' +
				'<cf-radio></cf-radio>' +
				'<span>' + this.referenceTag.label + '</span>' +
				'</div>' +
				'</cf-radio-button>'
		}

		protected onClick(event: MouseEvent) {
			this.checked = true// checked always true like native radio buttons
			super.onClick(event)
		}
	}


