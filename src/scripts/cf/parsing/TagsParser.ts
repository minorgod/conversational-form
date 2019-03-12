
	// interface

	// class
	export interface DataTag extends Object {
		tag: string // input, select etc.
		type: string // "password", "text" etc.
		children: DataTag[] // "password", "text" etc.
		// TODO: extend native tag interface?
	}

	export class TagsParser {
		public static parseTag(element: DataTag): HTMLElement | HTMLInputElement | HTMLSelectElement | HTMLButtonElement | HTMLOptionElement {
			const tag: HTMLElement | HTMLInputElement | HTMLSelectElement | HTMLButtonElement | HTMLOptionElement = document.createElement(element.tag) as HTMLInputElement | HTMLSelectElement | HTMLButtonElement | HTMLOptionElement
			tag.setAttribute('cf-formless', '')

			// TODO: ES6 mapping??
			for(const k in element) {
				if(k !== 'tag' && k !== 'children') {
					tag.setAttribute(k, (element as any)[k])
				}
			}

			return tag

		}

		public static parseGroupTag(groupTag: DataTag): HTMLElement {
			const groupEl: HTMLElement = TagsParser.parseTag(groupTag)
			const groupChildren: DataTag[] = groupTag.children
			for (let j = 0; j < groupChildren.length; j++) {
				const fieldSetTagData: DataTag = groupChildren[j]
				const tag: HTMLElement = TagsParser.parseTag(fieldSetTagData)
				groupEl.appendChild(tag)
			}
			return groupEl
		}

		public static parseJSONIntoElements(data: any): HTMLFormElement {
			const formEl: HTMLFormElement = document.createElement('form')
			for (let i = 0; i < data.length; i++) {
				const element: DataTag = data[i] as DataTag
				const tag: HTMLElement = TagsParser.parseTag(element)

				// add sub children to tag, ex. option, checkbox, etc.
				if(element.children && element.children.length > 0) {
					for (let j = 0; j < element.children.length; j++) {
						const subElement = TagsParser.parseTag(element.children[j])
						tag.appendChild(subElement)
					}
				}
				
				formEl.appendChild(tag)
			}

			return formEl
		}

		public static isElementFormless(element: HTMLElement): boolean {
			if(element.hasAttribute('cf-formless')) {
				return true
			}

			return false
		}
	}
