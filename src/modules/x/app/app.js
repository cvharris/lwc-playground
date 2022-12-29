import { LightningElement, api } from 'lwc';
// import WESTextInput from '@salesforce-ux/wes-text-input/dist/text-input';

export default class App extends LightningElement {
  @api derp = 'yarp';

  connectedCallback() {
    // customElements.define('wes-text-input', WESTextInput);
  }
}
