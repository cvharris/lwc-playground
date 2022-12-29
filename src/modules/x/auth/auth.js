import { LightningElement } from 'lwc';
import { OktaAuth } from '@okta/okta-auth-js';

const authConfig = {
  issuer: 'https://dev-23592845.okta.com/oauth2/default',
  clientId: '0oa79yd85chdQKJSQ5d7',
  redirectUri: 'http://localhost:6007/?path=/story/idx-userlogin--default',
  scopes: ['openid', 'profile', 'email'],
  tokenManager: {
    storage: 'localStorage',
  },
  cookies: {
    secure: false,
  },
};

export default class Auth extends LightningElement {
  username = '';
  password = '';
  userInfo = '';
  errorMessage = '';
  accessToken = '';
  isEnteringOTPCode = false;
  isAuthenticated = false;
  isLoading = true;
  isSigningOut = false;
  authClient = null;

  constructor() {
    super();
    this.loadOktaFromCDN();
  }

  loadOktaFromCDN = () => {
    this.authClient = new OktaAuth(authConfig);

    // Subscribe to authState change event.
    this.authClient.authStateManager.subscribe(this.handleAuthStateChange);

    this.startAuthListener();
  };

  startAuthListener = () => {
    this.authClient
      .start()
      .then(() => {
        console.log('uh');
        this.isLoading = false;
      })
      .catch((e) => console.error(e));
  };

  handleAuthStateChange = (authState) => {
    this.isAuthenticated = !!authState.isAuthenticated;
  };

  get isNotLoggedIn() {
    return this.isAuthenticated || this.isLoading;
  }

  usernameHandler = (e) => {
    const { value } = e.target;
    this.username = value;
  };

  passwordHandler = (e) => {
    const { value } = e.target;
    this.password = value;
  };

  submitDynamicSigninForm = () => {
    this.isSigningOut = false;
    this.toggleIsLoading();
    return this.authClient.idx
      .authenticate({
        username: this.username,
        password: '',
        authenticators: ['okta_email'],
        authenticator: 'okta_email',
        methodType: 'email',
      })
      .then(this.handleTransaction)
      .catch(async (e) => {
        // TODO: if user does not exist handle silently, redirect to register
        if (
          e.xhr &&
          JSON.parse(e.xhr.responseText).messages.value[0].message ===
            'The session has expired.'
        ) {
          this.authClient.idx.clearTransactionMeta();
          return this.submitDynamicSigninForm();
        }
        this.toggleIsLoading();
        this.showError(e);
      });
  };

  submitOTPCode = () => {
    this.isLoading = true;
    return this.authClient.idx
      .proceed({ verificationCode: this.password })
      .then(this.handleTransaction)
      .catch(this.showError);
  };

  handleTransaction = async (transaction) => {
    if (transaction.messages) {
      const errorMessage = transaction.messages.reduce(
        (string, message) => `${string}. ${message.message}`,
        'Some errors occurred'
      );
      this.showError(errorMessage);
    }

    let thisTransaction = transaction;

    switch (thisTransaction.status) {
      case 'PENDING':
        if (thisTransaction.nextStep?.name === 'select-authenticator-enroll') {
          thisTransaction = await this.authClient.idx.proceed({
            authenticator: 'okta_email',
          });
        }
        if (
          thisTransaction.nextStep?.name === 'select-authenticator-authenticate'
        ) {
          thisTransaction = await this.authClient.idx.proceed({
            authenticator: 'okta_email',
          });
        }
        if (
          thisTransaction.nextStep?.name === 'authenticator-verification-data'
        ) {
          thisTransaction = await this.authClient.idx.proceed({
            methodType: 'email',
          });
        }
        if (thisTransaction.nextStep?.name === 'challenge-authenticator') {
          this.isEnteringOTPCode = true;
        }
        break;
      case 'SUCCESS':
        if (thisTransaction.tokens) {
          this.authClient.tokenManager.setTokens(thisTransaction.tokens);
        }
        this.isEnteringOTPCode = false;
        break;
      case 'TERMINAL':
      case 'FAILURE': {
        const derp = thisTransaction.error;
        const errorMessage =
          thisTransaction.error?.errorSummary ||
          derp.context?.messages?.value.reduce(
            (string, message) => `${string}. ${message.message}`,
            'Some errors occurred'
          );
        this.showError(errorMessage);
        break;
      }
      default:
        throw new Error(
          'TODO: add handling for ' + thisTransaction.status + ' status'
        );
    }
    this.isEnteringOTPCode = true;
    this.isLoading = false;
  };

  logout = async () => {
    this.isSigningOut = true;
    this.isLoading = true;
    try {
      await this.authClient.revokeAccessToken();
      await this.authClient.closeSession();
      this.authClient.clearStorage();
      this.authClient.idx.clearTransactionMeta();
    } catch (e) {
      console.error({ e });
      this.showError(e);
    }

    this.resetState();
  };

  resetState = () => {
    this.isLoading = false;
    this.isSigningOut = false;
    this.isAuthenticated = false;
    this.isEnteringOTPCode = false;
    this.username = '';
    this.password = '';
  };

  renewToken = () => {
    return this.authClient.tokenManager
      .renew('accessToken')
      .catch(this.showError);
  };

  getUserInfo = async () => {
    try {
      const value = await this.authClient.token.getUserInfo();
      this.userInfo = JSON.stringify(value);
    } catch (e) {
      this.showError(e);
    }
  };

  showError = (errorMessage) => {
    this.errorMessage = errorMessage;
    this.isLoading = false;
  };

  toggleIsLoading = () => {
    this.isLoading = !this.isLoading;
  };

  showSigninForm = () => {
    this.isEnteringOTPCode = false;
  };
}
