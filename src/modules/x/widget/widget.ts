import { LightningElement } from 'lwc';
import OktaSignIn from '@okta/okta-signin-widget';

const signIn = new OktaSignIn({
  flow: 'login',
  issuer: 'https://dev-23592845.okta.com/oauth2/default',
  clientId: '0oa79yd85chdQKJSQ5d7',
  redirectUri: 'http://localhost:6007/?path=/story/idx-userlogin--default',
  scopes: ['openid', 'profile', 'email'],
});

export default class Auth extends LightningElement {
  static renderMode = 'light';

  connectedCallback(): void {
    // Finds the parent element, loads just fine
    // this.loadWidget();
    // Doesn't find the element, the library just fails silently
    this.loadWidgetInChildTemplate();
  }

  loadWidget = async () => {
    try {
      const yarp = await signIn.showSignIn({
        el: '#okta-auth',
      });

      console.log({ yarp });
    } catch (e) {
      console.error(e);
    }
  };

  loadWidgetInChildTemplate = async () => {
    try {
      const yarp = await signIn.showSignIn({
        el: '#child-okta-auth',
      });

      console.log({ yarp });
    } catch (e) {
      console.error(e);
    }
  };
}
