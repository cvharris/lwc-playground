import { LightningElement, api } from 'lwc';

export default class App extends LightningElement {

  @api derp = 'yarp';

  handleIt = (): void => {
    this.derp = this.derp === 'yarp' ? 'derp' : 'yarp'
  }
}
