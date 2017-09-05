/**
 * Module dependencies.
 */

import t from 't-component'
import List from 'democracyos-list.js'
import urlBuilder from 'lib/url-builder'
import FormView from '../../form-view/form-view'
import template from './template.jade'
import itemTemplate from './item.jade'

/**
 * Creates a list view of tags
 */

export default class TagsListView extends FormView {
  constructor (options = {}) {
    options.urlBuilder = urlBuilder
    options.form = { action: '/api/tag/generate' }

    super(template, options)
    this.options = options
  }

  switchOn () {
    this.list = new List('tags-wrapper', { valueNames: ['tag-title'] })
    this.on('success', this.bound('generate'))
  }

  generate (res) {
    this.options.tags.push(res.body)
    this.find('#tags-wrapper .list').prepend(itemTemplate({
      urlBuilder: this.options.urlBuilder,
      tag: res.body
    }))
    this.onsave()
  }

  onsave () {
    this.messages([t('admin-tags-form.message.onsuccess')])
  }
}
