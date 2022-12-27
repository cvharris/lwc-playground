export default class extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' }).innerHTML = '<h1>I am a third-party custom element</h1>'
  }
}