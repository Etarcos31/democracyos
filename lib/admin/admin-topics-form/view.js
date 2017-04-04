import confirm from 'democracyos-confirmation'
import Datepicker from 'democracyos-datepicker'
import debug from 'debug'
import o from 'component-dom'
import t from 't-component'
import page from 'page'
import moment from 'moment'
import tagsInput from 'tags-input'
import { dom as render } from 'lib/render/render'
import request from 'lib/request/request'
import Richtext from 'lib/richtext/richtext'
import urlBuilder from 'lib/url-builder'
import FormView from 'lib/form-view/form-view'
import topicStore from 'lib/stores/topic-store/topic-store'
import * as serializer from './body-serializer'
import template from './template.jade'
import linkTemplate from './link.jade'

const log = debug('democracyos:admin-topics-form')

/**
 * Creates a password edit view
 */
let created = false

export default class TopicForm extends FormView {
  constructor (topic, forum, tags) {
    const locals = {
      form: { title: null, action: null, method: null },
      topic: topic || { clauses: [] },
      tags: tags,
      moment: moment,
      forum,
      urlBuilder
    }

    if (topic) {
      locals.form.action = '/api/v2/topics/' + topic.id
      locals.form.title = 'admin-topics-form.title.edit'
      locals.form.method = 'put'
      topic.body = serializer.toHTML(topic.clauses)
        .replace(/<a/g, '<a rel="noopener noreferer" target="_blank"')
    } else {
      locals.form.action = '/api/v2/topics'
      locals.form.title = 'admin-topics-form.title.create'
      locals.form.method = 'post'
      locals.form.forum = forum.id
    }

    super(template, locals)

    this.topic = topic
    this.tags = tags
    this.forum = forum
    this.forumAdminUrl =
      ':forum/admin'.replace(':forum', forum ? `/${forum.name}` : '')

    if (tags.length === 0) return

    this.renderDateTimePickers()
    if (created) {
      this.messages([t('admin-topics-form.message.onsuccess')])
      created = false
    }

    this.pubButton = this.find('a.make-public')
    this.privButton = this.find('a.make-private')

    var body = this.find('textarea[name=body]')
    this.richtext = new Richtext(body)
  }

  /**
   * Turn on event bindings
   */

  switchOn () {
    this.bind('click', 'a.add-link', this.bound('onaddlinkclick'))
    this.bind('click', 'a.save', this.bound('onsaveclick'))
    this.bind('click', 'a.make-public', this.bound('onmakepublicclick'))
    this.bind('click', 'a.make-private', this.bound('onmakeprivateclick'))
    this.bind('click', 'a.delete-topic', this.bound('ondeletetopicclick'))
    this.bind('click', '.clear-closingAt', this.bound('onclearclosingat'))
    this.bind('change', '.method-input', this.bound('onmethodchange'))
    this.on('success', this.onsuccess)

    const actionMethod = this.topic && this.topic.action ? this.topic.action.method : ''
    const pollOptions = this.find('.poll-options')

    this.find('.method-input option').forEach(function (option) {
      if (option.value === actionMethod) option.selected = true
    })

    if (actionMethod === 'poll') pollOptions.removeClass('hide')

    const pollInput =
      this.find('input[type="tags"][name="action.pollOptions"]')
    if (pollInput.length > 0) tagsInput(pollInput[0])
  }

  /**
   * Handle `error` event with
   * logging and display
   *
   * @param {String} error
   * @api private
   */

  onsuccess (res) {
    log('Topic successfully saved')

    topicStore.parse(res.body.results.topic)
      .then((topic) => {
        if (this.topic) topicStore.unset(this.topic.id)
        topicStore.set(topic.id, topic)

        this.topic = topic

        created = true

        o('#content')[0].scrollTop = 0

        // Forcefully re-render the form
        page(urlBuilder.for('admin.topics.id', {
          forum: this.forum.name,
          id: this.topic.id
        }))
      })
      .catch((err) => { throw err })
  }

  /**
   * Renders datepicker and timepicker
   * elements inside view's `el`
   *
   * @return {TopicForm|Element}
   * @api public
   */

  renderDateTimePickers () {
    this.closingAt = this.find('[name=closingAt]', this.el)
    this.closingAtTime = this.find('[name=closingAtTime]')
    this.dp = new Datepicker(this.closingAt[0])
    return this
  }

  onaddlinkclick (evt) {
    evt.preventDefault()
    return this.addLink()
  }

  addLink () {
    const links = o('.topic-links', this.el)

    const link = render(linkTemplate, {
      link: {}
    })

    links.append(o(link))
  }

  onsaveclick (ev) {
    ev.preventDefault()
    this.find('form input[type=submit]')[0].click()
  }

  removeLink (id) {
    var link = o('[data-link="' + id + '"]', this.el)

    request
      .del(`/api/topic/${this.topic.id}/link`)
      .send({ link: id })
      .end(function (err, res) {
        if (err || !res.ok) return log('Found error %o', err || res.error)
        link[0].remove()
      })
  }

  postserialize (data = {}) {
    if (data['links[][text]']) {
      data.links = data['links[][text]'].map((text, i) => ({
        _id: data['links[][_id]'][i] || undefined,
        url: data['links[][url]'][i],
        text
      }))

      delete data['links[][_id]']
      delete data['links[][text]']
      delete data['links[][url]']
    }

    if (data.closingAt && data.closingAtTime) {
      data.closingAt = new Date(`${data.closingAt} ${data.closingAtTime}`)
      delete data.closingAtTime
    }

    data.clauses = serializer.toArray(data.body)
    delete data.body

    if (typeof data['action.pollOptions'] === 'string') {
      data['action.pollOptions'] = data['action.pollOptions'].split(',')
    }

    return data
  }

  onmakepublicclick (ev) {
    ev.preventDefault()
    var view = this

    this.pubButton.addClass('disabled')

    topicStore
      .publish(this.topic.id)
      .then(() => {
        view.pubButton.removeClass('disabled').addClass('hide')
        view.privButton.removeClass('hide')
      })
      .catch((err) => {
        view.pubButton.removeClass('disabled')
        log('Found error %o', err)
      })
  }

  onmakeprivateclick (ev) {
    ev.preventDefault()
    var view = this

    this.privButton.addClass('disabled')

    topicStore
      .unpublish(this.topic.id)
      .then(() => {
        view.privButton.removeClass('disabled')
        view.privButton.addClass('hide')
        view.pubButton.removeClass('hide')
      })
      .catch((err) => {
        view.pubButton.removeClass('disabled')
        log('Found error %o', err)
      })
  }

  ondeletetopicclick (ev) {
    ev.preventDefault()

    const _t = (s) => t(`admin-topics-form.delete-topic.confirmation.${s}`)

    const onconfirmdelete = (ok) => {
      if (!ok) return

      topicStore.destroy(this.topic.id)
        .then(() => {
          page(urlBuilder.for('admin', { name: this.forum.name }))
        })
        .catch((err) => {
          log('Found error %o', err)
        })
    }

    confirm(_t('title'), _t('body'))
      .cancel(_t('cancel'))
      .ok(_t('ok'))
      .modal()
      .closable()
      .effect('slide')
      .show(onconfirmdelete)
  }

  onclearclosingat (ev) {
    ev.preventDefault()
    this.closingAt.value('')
    if (this.dp && this.dp.popover) {
      this.dp.popover.hide()
      this.dp = new Datepicker(this.closingAt[0])
    }
  }

  onmethodchange (e) {
    if (e.target.value === 'poll') {
      this.find('.poll-options').removeClass('hide')
    } else {
      this.find('.poll-options').addClass('hide')
    }
  }
}
