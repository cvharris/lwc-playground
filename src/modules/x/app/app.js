import { LightningElement, api } from 'lwc';

export default class App extends LightningElement {
  static renderMode = 'light';

  @api derp = 'yarp';
}
