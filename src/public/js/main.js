hljs.initHighlightingOnLoad()

document.addEventListener("DOMContentLoaded", async function(event) {
  let tags = []
  const link_id = document.getElementById('link-card-id').dataset.index
  const tagsElem = document.getElementById('tags')
  const titleElem = document.getElementById('article-title')

  axios.get('/api/' + link_id)
    .then(resp => {
      console.log(resp)
      return resp.data.tags
    })
    .then(reTags => {
      tags = reTags
    })
    .catch(err => {
      console.log(`Error getting link tags: ${err}`)
    })

  const items = tags.map((i, tag) => {
    return {
      value: tag,
      label: tag,
      id: i
    }
  })

  const chosen = tags.map((i, tag) => {
    return {
      value: tag,
      label: tag,
      selected: false,
      disabled: false,
      id: i
    }
  })

  const tagChoices = new Choices(tagsElem, {
    items: [items],
    choices: [chosen],
    addItems: true,
    removeItems: true,
    removeItemButton: true,
    editItems: true,
    duplicateItemsAllowed: false,
    delimiter: ',',
    searchEnabled: true,
    searchChoices: true,
    classNames: {
      containerOuter: 'choice',
      containerInner: 'choice__inner',
      input: 'choice__input',
      inputCloned: 'choice__input--cloned',
      list: 'choice__list',
      listItems: 'choice__list--multiple',
      listSingle: 'choice__list--single',
      listDropdown: 'choice__list--dropdown',
      item: 'choice__item',
      itemSelectable: 'choice__item--selectable',
      itemDisabled: 'choice__item--disabled',
      itemChoice: 'choice__item--choice',
      placeholder: 'choice__placeholder',
      group: 'choice__group',
      groupHeading: 'choice__heading',
      button: 'choice__button',
      activeState: 'is-active',
      focusState: 'is-focused',
      openState: 'is-open',
      disabledState: 'is-disabled',
      highlightedState: 'is-highlighted',
      hiddenState: 'is-hidden',
      flippedState: 'is-flipped',
      loadingState: 'is-loading',
      noResults: 'has-no-results',
      noChoices: 'has-no-choices'
    }
  })
  // Handler for both addItem and removeItem
  function AddRemoveHandler(event) {
    const el = event.target
    const tags = el.value.split(',')

    axios.put('/api/' + link_id, {
      tags: tags
    })
    .then(response => {
      console.log(`Added Tag: ${event.detail.value} All tags: ${tags}`)
    })
    .catch(err => {
      console.log(err)
    })
  }
  // Listen for changes to the tags list
  tagsElem.addEventListener('addItem', AddRemoveHandler, false)
  tagsElem.addEventListener('removeItem', AddRemoveHandler, false)
  //
  // Listen for changes to editing the title
  titleElem.addEventListener('blur', function(event) {
    const el = event.target
    console.log(`Updated title: ${link_id} ${this.innerHTML}`)

    axios.put('/api/' + link_id, {
      title: this.innerHTML
    })
    .then(response => {
      console.log(`Updated title: ${link_id} ${this.innerHTML}`)
    })
    .catch(err => {
      console.log(err)
    })
  }, false)
  //
  // PikaDay
  const picker = new Pikaday({
    field: document.getElementById('datepicker'),
    format: 'ddd, MMM Do YYYY',
    onSelect() {
      // Make axios call to update
      axios.put('/api/' + link_id, {
        created_at: this.getMoment().toISOString()
      })
      .then(response => {
        console.log(`Changed created_at: ${this.getMoment().toISOString()}`)
      })
      .catch(err => {
        console.log(err)
      })
    }
  })
  // Annotator.js
  const app = new annotator.App()
  app.include(annotator.ui.main, {
    editorExtensions: [annotator.ui.tags.editorExtension],
    viewerExtensions: [
        annotator.ui.tags.viewerExtension
    ]
  })
  app.include(annotator.storage.http, {
    prefix: `/anno`
  })
  app.start()
    // .then(() =>{
    //   app.annotations.load()
    // })
})