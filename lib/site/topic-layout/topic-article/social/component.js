import React, { Component } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import t from 't-component'
import guid from 'mout/random/guid'
import config from 'lib/config'
import request from 'lib/request/request.js'
import Icon from 'lib/common/icon'

export default class Social extends Component {
  constructor (props) {
    super(props)

    this.state = {
      showResults: false,
      stats: {},
      loading: true
    }
  }

  componentWillMount () {
    this.setStateFromProps(this.props)
  }

  componentWillReceiveProps (props) {
    this.setStateFromProps(props)
  }

  setStateFromProps (props) {
    this.setState({ loading: true })
    const { topic } = props

    request
    .get('/api/stats/topic/' + topic.id)
    .end((err, res) => {
      if (err || !res.ok) {
        this.handleError([err || res.text])
      }
      this.setState({
        showResults: topic.closed,
        stats: res.body,
        loading: false
      })
    })
  }

  handleError = (err) => {
    console.log(err)
  }

  render () {
    const { topic } = this.props
    const { url, mediaTitle } = topic
    const { showResults } = this.state

    const socialLinksUrl = window.location.origin + url
    const twitterText = encodeURIComponent(
      config.tweetText ? t(config.tweetText, { topic }) : mediaTitle
    )

    let loading = (<i className='fa fa-spinner fa-spin fa-fw' />)

    let participants = this.state.loading ? loading : (
      <div className='participants-item'>
        <Icon keyName='common.users' tooltip />
        &nbsp;
        {this.state.stats.participants}
      </div>
    )

    let votes = this.state.loading ? loading : (
      <div className='participants-item'>
        <Icon keyName='common.votes' tooltip />
        &nbsp;
        {this.state.stats.votes.all}
      </div>
    )

    let comments = this.state.loading ? loading : (
      <div className='participants-item'>
        <Icon keyName='common.comments' tooltip />
        &nbsp;
        {this.state.stats.comments.all}
      </div>
    )

    let tooltipRatings = (<Tooltip id={`tooltip-common-ratings-${guid()}`}><b>{t('common.ratings')}</b></Tooltip>)
    let ratings = this.state.loading ? loading : (
      <div className='participants-item'>
        <OverlayTrigger trigger={['hover', 'focus']} placement='bottom' overlay={tooltipRatings}>
          <i className='icon-ratings'>
            <Icon keyName='common.ratings.up' />/<Icon keyName='common.ratings.down' />
          </i>
        </OverlayTrigger>
        &nbsp;
        {this.state.stats.comments.ratings}
      </div>
    )

    return (
      <div className='topic-article-content topic-social'>
        <div className='participants-box'>
          <b>{t('proposal-social.title')}&emsp;</b>
          {participants}
          {showResults && votes}
          {comments}
          {ratings}
        </div>
        <div className='share-links'>
          <a
            href={`http://www.facebook.com/sharer.php?u=${socialLinksUrl}`}
            target='_blank'
            rel='noopener noreferrer'
            className='icon-social-facebook' />
          <a
            href={`http://twitter.com/share?text=${twitterText}&url=${socialLinksUrl}`}
            target='_blank'
            rel='noopener noreferrer'
            className='icon-social-twitter' />
        </div>
      </div>
    )
  }
}
