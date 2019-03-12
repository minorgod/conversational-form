import ConversationalForm from '../src/scripts/cf/ConversationalForm'

declare module '*.ts' {
	export {ConversationalForm} from '../src/scripts/cf/ConversationalForm'
	export default ConversationalForm
}

declare global {
	namespace cf {
		const ConversationalForm
	}
}
export {ConversationalForm}
export default ConversationalForm
