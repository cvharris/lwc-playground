import { LightningElement, api } from 'lwc';
import element from '../../../../element'
import WESTextInput from '../../../../node_modules/@salesforce-ux/wes-text-input/text-input'

export default class App extends LightningElement {

  @api derp = 'yarp';

  connectedCallback() {
    customElements.define('x-thirdparty', element)
    customElements.define('wes-text-input', WESTextInput)
  }
}