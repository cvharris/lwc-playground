import { LightningElement, api } from 'lwc';
import element from '../../../../element'
import WESTextInput from '@salesforce-ux/wes-text-input/dist/text-input'

export default class App extends LightningElement {

  @api derp = 'yarp';

  connectedCallback() {
    customElements.define('x-thirdparty', element)
    customElements.define('wes-text-input', WESTextInput)
  }
}