// Patch: Ensure f3 is imported and used in createChart.js
import f3 from "./index.js";

export default function(options) {
  return new CreateChart(options);
}

function CreateChart(options) {
  const {
    cont,
    data,
    honoreeId,
    authContext,
    node_separation = 250,
    level_separation = 150,
    is_horizontal = false,
    single_parent_empty_card = true,
    transition_time = 2000,
    linkSpouseText = false,
    personSearch = null,
    is_card_html = false,
    beforeUpdate = null,
    afterUpdate = null
  } = options;

  this.cont = null;
  this.store = null;
  this.svg = null;
  this.getCard = null;
  this.node_separation = node_separation;
  this.level_separation = level_separation;
  this.is_horizontal = is_horizontal;
  this.single_parent_empty_card = single_parent_empty_card;
  this.transition_time = transition_time;
  this.linkSpouseText = linkSpouseText;
  this.personSearch = personSearch;
  this.is_card_html = is_card_html;
  this.beforeUpdate = beforeUpdate;
  this.afterUpdate = afterUpdate;
  this.honoreeId = honoreeId;
  this.authContext = authContext;

  this.init(cont, data);

  return this;
}

CreateChart.prototype.init = function(cont, data) {
  this.cont = cont = setCont(cont)
  const getSvgView = () => cont.querySelector('svg .view')
  const getHtmlSvg = () => cont.querySelector('#htmlSvg')
  const getHtmlView = () => cont.querySelector('#htmlSvg .cards_view')

  this.svg = f3.createSvg(cont, {onZoom: f3.htmlHandlers.onZoomSetup(getSvgView, getHtmlView)})
  f3.htmlHandlers.createHtmlSvg(cont)
  createNavCont(this.cont)

  this.store = f3.createStore({
    data,
    node_separation: this.node_separation,
    level_separation: this.level_separation,
    single_parent_empty_card: this.single_parent_empty_card,
    is_horizontal: this.is_horizontal
  })

  this.store.setOnUpdate(props => {
    if (this.beforeUpdate) this.beforeUpdate(props)
    props = Object.assign({transition_time: this.transition_time}, props || {})
    if (this.is_card_html) props = Object.assign({}, props || {}, {cardHtml: getHtmlSvg()})
    f3.view(this.store.getTree(), this.svg, this.getCard(), props || {})
    if (this.linkSpouseText) linkSpouseText(this.svg, this.store.getTree(), Object.assign({}, props || {}, {linkSpouseText: this.linkSpouseText, node_separation: this.node_separation}))
    if (this.afterUpdate) this.afterUpdate(props)
  })
}

function setCont(cont) {
  if (typeof cont === "string") cont = document.querySelector(cont)
  return cont
}

function createNavCont(cont) {
  // ...existing code for nav container...
}
