import f3 from '../../src/index.js'
import { v4 as uuidv4 } from 'uuid';
import Edit from './elements/Edit.js'
import ReactiveTextarea from "./elements/ReactiveTextarea.js"
import ReactiveVanila from "./elements/ReactiveVanila.js"
import ReactiveVue from "./elements/ReactiveVue.js"
import ReactiveReact from "./elements/ReactiveReact.js"
import Display from "./elements/Display.js"
import {Form} from "../../src/view/elements/Form.js"


(async () => {
  const cont = document.querySelector("#FamilyChart"),
    card_dim = {w:220,h:70,text_x:75,text_y:15,img_w:60,img_h:60,img_x:5,img_y:5},
    card_display = cardDisplay(),
    card_edit = cardEditParams(),
    svg = f3.createSvg(cont),
    store = f3.createStore({
      data: firstNode(),
      node_separation: 250,
      level_separation: 150
    }),
    Card = f3.elements.Card({
      store,
      svg,
      card_dim,
      card_display,
      mini_tree: true,
      cardEditForm,
      addRelative: f3.handlers.AddRelative({store, cont, card_dim, cardEditForm, labels: {mother: 'Add mother'}}),
    }),

    edit = Edit('#edit_cont', card_edit),
    display = Display('#display_cont', store, card_display),
    reactiveTextArea = ReactiveTextarea(data => {store.update.data(data); store.updateTree()}, "#textarea", "#update_btn"),
    reactiveVanila = ReactiveVanila( "#ReactiveVanila"),
    reactiveVue = ReactiveVue( "#ReactiveVue"),
    reactiveReact = ReactiveReact( "#ReactiveReact"),
    onUpdate = (props) => {
      f3.view(store.getTree(), svg, Card, props)
      reactiveTextArea.update(store.getData());
      reactiveVanila.update(store, card_display);
      reactiveVue.update(store, card_display);
      reactiveReact.update(store, card_display);
    }

  fetch('./elements/family-chart.css').then(r => r.text()).then(text => document.querySelector('#family-chart-css').innerText = text)
  store.setOnUpdate(onUpdate)
  store.updateTree({initial: true})

  function cardEditForm(props) {
    const postSubmit = props.postSubmit;
    props.postSubmit = (ps_props) => {postSubmit(ps_props)}
    const el = document.querySelector('#form_modal'),
      modal = M.Modal.getInstance(el),
      edit = {el, open:()=>modal.open(), close:()=>modal.close()}
    Form({...props, card_edit, card_display, edit})
  }
})();

function firstNode() {
  return [{
    id: uuidv4(),
    rels: {},
    data: {
      'first name': 'Name',
      'last name': "Surname",
      'birthday': 1970,
      avatar: 'https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg',
      gender: "M"
    }
  }];
}

function cardEditParams() {
  return [
    {type: 'text', placeholder: 'first name', key: 'first name'},
    {type: 'text', placeholder: 'last name', key: 'last name'},
    {type: 'text', placeholder: 'birthday', key: 'birthday'},
    {type: 'text', placeholder: 'avatar', key: 'avatar'}
  ]
}

function cardDisplay() {
  const d1 = d => `${d.data['first name'] || ''} ${d.data['last name'] || ''}`,
    d2 = d => `${d.data['birthday'] || ''}`
  d1.create_form = "{first name} {last name}"
  d2.create_form = "{birthday}"

  return [d1, d2]
}