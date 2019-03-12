import {FlowDTO} from '../logic/FlowManager'
	// interface

	// general interface for user input, like the default UserTextInput
export default interface IUserInputElement {
		visible: boolean
		disabled: boolean
		el: HTMLElement
		dealloc(): void
		onFlowStopped(): void
		setFocusOnInput(): void
		reset(): void
		getFlowDTO(): FlowDTO
	}
