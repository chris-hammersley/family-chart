import CalculateTree from "./CalculateTree/CalculateTree.js"
import createStore from "./createStore.js"
import view from "./view/view.js"
import createSvg from "./view/view.svg.js"
import * as handlers from './handlers.js'
import * as elements from './elements.js'
import * as htmlHandlers from './view/view.html.handlers.js'
import * as icons from './view/elements/Card.icons.js'
import createChart from './createChart.js'
import EditTreeFactory, { EditTree } from './CreateTree/editTree.js';
import * as api from './utils/api.js';

import CardSvg from './Cards/CardSvg.js'
import CardHtml from './Cards/CardHtml.js'

export default {
  CalculateTree,
  createStore,
  view,
  createSvg,
  handlers,
  elements,
  htmlHandlers,
  icons,
  createChart,
  CardSvg,
  CardHtml,
  api,
  EditTree: EditTreeFactory, // for backward compatibility
  EditTreeClass: EditTree,   // for direct class usage
}
