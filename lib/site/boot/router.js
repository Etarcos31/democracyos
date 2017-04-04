import React from 'react'
import { Route, IndexRoute } from 'react-router'
import config from 'lib/config'
import urlBuilder from 'lib/url-builder'
import user from 'lib/site/user/user'

import Layout from 'lib/site/layout/component'
import TopicLayout from 'lib/site/topic-layout/component'
import HomeForum from 'lib/site/home-forum/component'
import HomeMultiForum from 'lib/site/home-multiforum/component'
import SignIn from 'lib/site/sign-in/component'
import SignUp from 'lib/site/sign-up/component'
import Resend from 'lib/site/resend/component'
import Forgot from 'lib/site/forgot/component'
import Reset from 'lib/site/reset/component'
import Help from 'lib/site/help/component'
import Notifications from 'lib/site/notifications/component'
import NotFound from 'lib/site/error-pages/not-found/component'
import NotAllowed from 'lib/site/error-pages/not-allowed/component'

const router = [ // Array because allows exansion
  <Route key='lib-site' path='/' component={Layout}>
    <IndexRoute
      component={config.multiForum ? HomeMultiForum : HomeForum} />

    <Route path='404' component={NotFound} />
    <Route path='401' component={NotAllowed} />

    <Route path='signin' component={SignIn} onEnter={restrictLoggedin} />

    <Route path='signup' onEnter={restrictLoggedin}>
      <IndexRoute component={SignUp} />
      <Route
        path='resend-validation-email'
        component={Resend} />
      <Route
        path='validate/:token'
        component={Resend} />
      <Route
        path=':reference'
        component={SignUp} />
    </Route>

    <Route path='forgot' onEnter={restrictLoggedin}>
      <IndexRoute component={Forgot} />
      <Route path='reset/:token' component={Reset} />
    </Route>

    <Route path={urlBuilder.for('site.help')} component={Help} />
    <Route path={urlBuilder.for('site.help.article')} component={Help} />

    <Route path='notifications' component={Notifications} />

    <Route path={urlBuilder.for('site.topic')} component={TopicLayout} />

    <Route path='settings' component={reload} />
    <Route path='settings/*' component={reload} />
    <Route path='forums/new' component={reload} />
    <Route path={urlBuilder.for('admin')} component={reload} />
    <Route path={urlBuilder.for('admin.wild')} component={reload} />

    {config.multiForum && (
      <Route
        path={urlBuilder.for('site.forum')}
        component={HomeForum} onEnter={setForumParam} />
    )}

    <Route path='*' component={NotFound} />
  </Route>
]

export default router

function reload () {
  window.location.reload(false)
  return null
}

function setForumParam (nextState) {
  if (!config.multiForum) {
    nextState.params.forum = config.defaultForum
  }
}

function restrictLoggedin (nextState, replace, next) {
  user.fetch().then(() => {
    if (user.state.rejected) return next()
    window.location = '/'
  })
}
