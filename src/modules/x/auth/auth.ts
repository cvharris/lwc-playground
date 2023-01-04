import { LightningElement } from 'lwc';
import {
  OktaAuth,
  OktaAuthOptions,
  AuthState,
  IdxTransaction,
  Token,
  AuthApiError,
  AuthenticatorKey,
  IdxResponse,
} from '@okta/okta-auth-js';

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

const authClient = new OktaAuth(authConfig);

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

  constructor() {
    super();
    // Subscribe to authState change event.
    authClient.authStateManager.subscribe(this.handleAuthStateChange);

    this.startAuthListener();
  }

  startAuthListener = (): void => {
    authClient
      .start()
      .then(() => {
        this.isLoading = false;
      })
      .catch((e: unknown) => console.error(e));
  };

  handleAuthStateChange = (authState: AuthState): void => {
    this.isAuthenticated = !!authState.isAuthenticated;
  };

  get isNotLoggedIn(): boolean {
    return this.isAuthenticated || this.isLoading;
  }

  usernameHandler = (e: Event): void => {
    const { value } = e.target as HTMLInputElement;
    this.username = value;
  };

  passwordHandler = (e: Event): void => {
    const { value } = e.target as HTMLInputElement;
    this.password = value;
  };

  submitDynamicSigninForm = (): Promise<void> => {
    this.isSigningOut = false;
    this.toggleIsLoading();
    return authClient.idx
      .authenticate({
        username: this.username,
        password: '',
        authenticators: [AuthenticatorKey.OKTA_EMAIL],
        authenticator: AuthenticatorKey.OKTA_EMAIL,
        methodType: 'email',
      })
      .then(this.handleTransaction)
      .catch(async (e: AuthApiError) => {
        // TODO: if user does not exist handle silently, redirect to register
        if (
          e.xhr &&
          JSON.parse(e.xhr.responseText).messages.value[0].message ===
            'The session has expired.'
        ) {
          authClient.idx.clearTransactionMeta();
          return this.submitDynamicSigninForm();
        }
        this.toggleIsLoading();
        this.showError(e);
      });
  };

  submitOTPCode = (): Promise<void> => {
    this.isLoading = true;
    return authClient.idx
      .proceed({ verificationCode: this.password })
      .then(this.handleTransaction)
      .catch(this.showError);
  };

  handleTransaction = async (transaction: IdxTransaction): Promise<void> => {
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
          thisTransaction = await authClient.idx.proceed({
            authenticator: 'okta_email',
          });
        }
        if (
          thisTransaction.nextStep?.name === 'select-authenticator-authenticate'
        ) {
          thisTransaction = await authClient.idx.proceed({
            authenticator: 'okta_email',
          });
        }
        if (
          thisTransaction.nextStep?.name === 'authenticator-verification-data'
        ) {
          thisTransaction = await authClient.idx.proceed({
            methodType: 'email',
          });
        }
        if (thisTransaction.nextStep?.name === 'challenge-authenticator') {
          this.isEnteringOTPCode = true;
        }
      case 'SUCCESS':
        if (thisTransaction.tokens) {
          authClient.tokenManager.setTokens(thisTransaction.tokens);
        }
        this.isEnteringOTPCode = false;
        break;
      case 'TERMINAL':
      case 'FAILURE':
        const derp = thisTransaction.error as IdxResponse;
        const errorMessage =
          thisTransaction.error?.errorSummary ||
          derp.context?.messages?.value.reduce(
            (string, message) => `${string}. ${message.message}`,
            'Some errors occurred'
          );
        this.showError(errorMessage);
        break;
      default:
        throw new Error(
          'TODO: add handling for ' + thisTransaction.status + ' status'
        );
    }
    this.isEnteringOTPCode = true;
    this.isLoading = false;
  };

  logout = async (): Promise<void> => {
    this.isSigningOut = true;
    this.isLoading = true;
    try {
      await authClient.revokeAccessToken();
      await authClient.closeSession();
      authClient.clearStorage();
      authClient.idx.clearTransactionMeta();
    } catch (e: unknown) {
      console.error({ e });
      this.showError(e);
    }

    this.resetState();
  };

  resetState = (): void => {
    this.isLoading = false;
    this.isSigningOut = false;
    this.isAuthenticated = false;
    this.isEnteringOTPCode = false;
    this.username = '';
    this.password = '';
  };

  renewToken = (): Promise<void | Token> => {
    return authClient.tokenManager.renew('accessToken').catch(this.showError);
  };

  getUserInfo = async (): Promise<void> => {
    try {
      const value = await authClient.token.getUserInfo();
      this.userInfo = JSON.stringify(value);
    } catch (e) {
      this.showError(e);
    }
  };

  showError = (errorMessage: string): void => {
    this.errorMessage = errorMessage;
    this.isLoading = false;
  };

  toggleIsLoading = (): void => {
    this.isLoading = !this.isLoading;
  };

  showSigninForm = (): void => {
    this.isEnteringOTPCode = false;
  };
}
