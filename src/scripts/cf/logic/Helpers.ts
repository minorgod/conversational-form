// interface

export interface TouchVector2d {
	x: number,
	y: number,
	touches: any[],
}

// class
export class Helpers {
	
	
	public static caniuse = {
		fileReader: () => {
			if (( window as any ).File && ( window as any ).FileReader && ( window as any ).FileList && window.Blob) {
				return true
			}
			
			return false
		}
	}
	
	public static lerp (norm: number, min: number, max: number): number {
		return ( max - min ) * norm + min
	}
	
	public static norm (value: number, min: number, max: number): number {
		return ( value - min ) / ( max - min )
	}
	
	public static getXYFromMouseTouchEvent (event: Event | MouseEvent | TouchEvent): TouchVector2d {
		let touches: any[] = null
		if (( event as any ).originalEvent) {
			touches = ( event as any ).originalEvent.touches || ( event as any ).originalEvent.changedTouches
		} else if (( event as TouchEvent ).changedTouches) {
			touches = ( event as TouchEvent ).changedTouches as any
		}
		
		if (touches) {
			return { x: touches[ 0 ].pageX, y: touches[ 0 ].pageY, touches: touches[ 0 ] }
		} else {
			return { x: ( event as MouseEvent ).pageX, y: ( event as MouseEvent ).pageY, touches: null }
		}
	}
	
	public static getInnerTextOfElement (element: Element): string {
		const tmp = document.createElement('DIV')
		tmp.innerHTML = element.innerHTML
		// return
		let text: string = tmp.textContent || tmp.innerText || ''
		// text = String(text).replace('\t','');
		text = String(text).replace(/^\s+|\s+$/g, '')
		
		return text
	}
	
	public static getMouseEvent (eventString: string): string {
		const mappings: any = []
		mappings[ 'click' ] = 'ontouchstart' in window ? 'touchstart' : 'click'
		mappings[ 'mousedown' ] = 'ontouchstart' in window ? 'touchstart' : 'mousedown'
		mappings[ 'mouseup' ] = 'ontouchstart' in window ? 'touchend' : 'mouseup'
		mappings[ 'mousemove' ] = 'ontouchstart' in window ? 'touchmove' : 'mousemove'
		
		return mappings[ eventString ] as string
	}
	
	public static isInternetExlorer () {
		const ua = window.navigator.userAgent
		const msie = ua.indexOf('MSIE ')
		return msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)
	}
	
	public static getValuesOfBars (str: string): string[] {
		
		let strs: string[] = str.split('||')
		
		// TODO: remove single |
		// fallback to the standard
		if (strs.length <= 1) {
			strs = str.split('|')
		}
		
		return strs
	}
	
	public static setTransform (el: any, transformString: string) {
		el.style[ '-webkit-transform' ] = transformString
		el.style[ '-moz-transform' ] = transformString
		el.style[ '-ms-transform' ] = transformString
		el.style[ 'transform' ] = transformString
	}
	
	// deep extends and object, from: https://andrewdupont.net/2009/08/28/deep-extending-objects-in-javascript/
	public static extendObject (destination: any, source: any): any {
		for (const property in source) {
			if (source[ property ] && source[ property ].constructor &&
				source[ property ].constructor === Object) {
				destination[ property ] = destination[ property ] || {}
				arguments.callee(destination[ property ], source[ property ])
			} else {
				destination[ property ] = source[ property ]
			}
		}
		return destination
	}
}

